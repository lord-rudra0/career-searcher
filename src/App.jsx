import React, { useState, useEffect } from 'react';
import { BrainCog } from 'lucide-react';
import questionsData from './questions.json';
import axios from 'axios';

// Create axios instance with base URL and timeout
const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

function App() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [careerResults, setCareerResults] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize with predefined questions
    setAllQuestions(questionsData.predefinedQuestions);
  }, []);

  const handleSelectAnswer = (option) => {
    setCurrentAnswer(option);
    setError(null);
  };

  const handleNextQuestion = async () => {
    if (!currentAnswer) {
      setError('Please select an answer before continuing');
      return;
    }

    // Save current Q&A
    const currentQ = allQuestions[currentQuestionIndex];
    const newAnswer = {
      question: currentQ.question,
      answer: currentAnswer
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    // If we've completed predefined questions, start generating AI questions
    if (currentQuestionIndex >= questionsData.predefinedQuestions.length - 1 &&
      allQuestions.length < 20) {
      try {
        const response = await api.post('/generate-question', {
          previousQA: updatedAnswers
        });

        if (response.data.question) {
          const aiQuestion = {
            id: allQuestions.length + 1,
            ...response.data.question,
            type: 'mcq'
          };
          setAllQuestions(prev => [...prev, aiQuestion]);
        }
      } catch (err) {
        console.error('Error generating AI question:', err);
        setError('Failed to generate next question');
        return;
      }
    }

    // Move to next question or finish
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer('');
    } else if (updatedAnswers.length >= 20) {
      handleFinish(updatedAnswers);
    }

    // Add these logs in handleNextQuestion
    console.log('Current index:', currentQuestionIndex);
    console.log('All questions:', allQuestions);
    console.log('Predefined questions length:', questionsData.predefinedQuestions.length);
  };

  const handleFinish = async (finalAnswers) => {
    setIsAnalyzing(true);
    try {
      const response = await api.post('/analyze-answers', {
        answers: finalAnswers
      });
      setCareerResults(response.data.careers);
    } catch (err) {
      console.error('Error analyzing answers:', err);
      setError('Failed to analyze answers');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (careerResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-indigo-800">Your Career Matches</h2>
          <div className="space-y-6">
            {careerResults.map((career, index) => (
              <div key={index} className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-indigo-900">{career.title}</h3>
                  <span className="text-lg font-bold text-indigo-600">{career.match}%</span>
                </div>
                <p className="mt-2 text-gray-700">{career.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {isAnalyzing ? (
          <div className="text-center">
            <BrainCog className="w-16 h-16 mx-auto mb-4 text-indigo-600 animate-pulse" />
            <h2 className="text-2xl font-bold text-indigo-900">Analyzing Your Responses...</h2>
            <p className="mt-2 text-gray-600">Please wait while our AI processes your answers.</p>
          </div>
        ) : currentQuestion ? (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-indigo-900">Question {currentQuestionIndex + 1}</h2>
                <span className="text-sm text-gray-500">
                  {currentQuestionIndex + 1} of {Math.max(20, allQuestions.length)}
                </span>
              </div>
              <p className="text-lg text-gray-700 mb-6">{currentQuestion.question}</p>
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(option)}
                    className={`w-full p-4 text-left rounded-lg transition-colors ${currentAnswer === option
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleNextQuestion}
              disabled={!currentAnswer}
              className={`w-full py-3 px-6 rounded-lg transition-colors ${currentAnswer
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {currentQuestionIndex < 19 ? 'Next Question' : 'Finish'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default App;