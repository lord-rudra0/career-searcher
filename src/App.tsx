import React, { useState, useEffect } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { Category, Answer } from './types';
import { initialQuestions } from './questions';
import axios from 'axios';

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [nextQuestions, setNextQuestions] = useState<Category[]>([]);
  const [careerRecommendations, setCareerRecommendations] = useState([]);
  const [showCareers, setShowCareers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCategories(initialQuestions);
  }, []);

  const handleAnswer = async (answer: string) => {
    const currentQuestionData = categories[currentCategory].questions[currentQuestion];
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestionData.id]: answer }));

    setAnswers((prevAnswers) => [
      ...prevAnswers,
      { questionId: currentQuestionData.id, answer }
    ]);

    setTimeout(() => {
      if (currentQuestion + 1 < categories[currentCategory].questions.length) {
        setCurrentQuestion(currentQuestion + 1);
      } else if (currentCategory + 1 < categories.length) {
        setCurrentCategory(currentCategory + 1);
        setCurrentQuestion(0);
      } else {
        setLoading(true);
        setError(null);

        axios.post('http://localhost:5000/analyze', {
          answers: [...answers, { questionId: currentQuestionData.id, answer }]
        })
          .then(response => {
            if (!response.data.questions || !response.data.careers) {
              throw new Error('Invalid response format from server');
            }
            setNextQuestions(response.data.questions[0].questions.slice(0, 5));
            setCareerRecommendations(response.data.careers);
            setCompleted(true);
          })
          .catch(error => {
            console.error('Error analyzing answers:', error);
            setError('Failed to generate follow-up questions. Please try again.');
          })
          .finally(() => setLoading(false));
      }
    }, 500); // Delay transition for UX
  };

  const handleShowCareers = () => setShowCareers(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">Analyzing your responses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (completed && !showCareers) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Follow-up Questions</h2>
          {nextQuestions.map((question, idx) => (
            <div key={idx} className="bg-white rounded-lg p-6 mb-4 shadow-md">
              <p className="text-lg mb-4">{question.text}</p>
              <div className="grid grid-cols-1 gap-3">
                {question.options.map((option, oIdx) => (
                  <button
                    key={oIdx}
                    className={`text-left px-4 py-3 border rounded-lg transition-colors 
                    ${selectedAnswers[question.id] === option ? "bg-green-500 text-white" : "hover:bg-blue-50"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={handleShowCareers}
            className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            See Career Recommendations
          </button>
        </div>
      </div>
    );
  }

  if (showCareers) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Career Recommendations</h2>
          {careerRecommendations.map((career, idx) => (
            <div key={idx} className="bg-white rounded-lg p-6 mb-4 shadow-md">
              <h3 className="text-lg font-semibold">{career.name}</h3>
              <p className="text-gray-600">Match Percentage: {career.match_percentage}%</p>
            </div>
          ))}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Restart Assessment
          </button>
        </div>
      </div>
    );
  }

  const currentQuestionData = categories[currentCategory]?.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">AI-Powered Assessment</h1>
          </div>
          <div className="text-sm text-gray-600">
            Question {currentQuestion + 1} of {categories[currentCategory]?.questions.length}
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-md">
          <h2 className="text-xl font-semibold mb-2">{categories[currentCategory]?.category}</h2>
          <p className="text-lg mb-6">{currentQuestionData?.text}</p>

          <div className="grid grid-cols-1 gap-3">
            {currentQuestionData?.options.map((option, idx) => (
              <button
                key={idx}
                className={`text-left px-4 py-3 border rounded-lg transition-colors 
                ${selectedAnswers[currentQuestionData.id] === option ? "bg-green-500 text-white" : "hover:bg-blue-50"}`}
                onClick={() => handleAnswer(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
