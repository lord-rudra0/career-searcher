import React, { useState, useEffect } from 'react';
import { BrainCog, Brain, ChevronRight, SkipForward } from 'lucide-react';
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

  const handleSkipQuestion = () => {
    setCurrentQuestionIndex(prev => prev + 1);
    setCurrentAnswer('');
    setError(null);
  };

  if (careerResults) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* Header */}
        <header className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Career Finder AI
              </h1>
            </div>
            {!careerResults && (
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {Math.max(20, allQuestions.length)}
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 pt-24 pb-20">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded animate-fade-in">
              {error}
            </div>
          )}

          {!careerResults && currentQuestionIndex < allQuestions.length && (
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl animate-slide-up">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {allQuestions[currentQuestionIndex]?.question}
              </h2>
              <div className="space-y-3">
                {allQuestions[currentQuestionIndex]?.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(option)}
                    className={`w-full p-4 text-left rounded-lg transition-all duration-200 transform hover:scale-102 ${currentAnswer === option
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8 space-x-4">
                <button
                  onClick={handleSkipQuestion}
                  className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip Question
                </button>
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50"
                  disabled={!currentAnswer}
                >
                  {currentQuestionIndex < 19 ? (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    'Finish'
                  )}
                </button>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-20 animate-fade-in">
              <BrainCog className="w-16 h-16 mx-auto text-blue-500 animate-spin" />
              <p className="mt-4 text-xl text-gray-700">Analyzing your responses...</p>
            </div>
          )}

          {careerResults && (
            <div className="max-w-3xl mx-auto animate-slide-up">
              <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
                Your Career Matches
              </h2>
              {careerResults.map((career, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-6 mb-6 transform transition-all duration-300 hover:shadow-lg"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <h3 className="text-xl font-bold text-gray-800">{career.title}</h3>
                  <div className="mt-2 mb-3 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${career.match}%` }}
                    />
                  </div>
                  <p className="text-gray-600">{career.description}</p>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-6 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-gray-400">
              Powered by AI to help you find your perfect career path
            </p>
          </div>
        </footer>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Career Finder AI
            </h1>
          </div>
          {!careerResults && (
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {Math.max(20, allQuestions.length)}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 pt-24 pb-20">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded animate-fade-in">
            {error}
          </div>
        )}

        {!careerResults && currentQuestionIndex < allQuestions.length && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl animate-slide-up">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {allQuestions[currentQuestionIndex]?.question}
            </h2>
            <div className="space-y-3">
              {allQuestions[currentQuestionIndex]?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(option)}
                  className={`w-full p-4 text-left rounded-lg transition-all duration-200 transform hover:scale-102 ${currentAnswer === option
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-8 space-x-4">
              <button
                onClick={handleSkipQuestion}
                className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip Question
              </button>
              <button
                onClick={handleNextQuestion}
                className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50"
                disabled={!currentAnswer}
              >
                {currentQuestionIndex < 19 ? (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  'Finish'
                )}
              </button>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-20 animate-fade-in">
            <BrainCog className="w-16 h-16 mx-auto text-blue-500 animate-spin" />
            <p className="mt-4 text-xl text-gray-700">Analyzing your responses...</p>
          </div>
        )}

        {careerResults && (
          <div className="max-w-3xl mx-auto animate-slide-up">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
              Your Career Matches
            </h2>
            {careerResults.map((career, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 mb-6 transform transition-all duration-300 hover:shadow-lg"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <h3 className="text-xl font-bold text-gray-800">{career.title}</h3>
                <div className="mt-2 mb-3 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${career.match}%` }}
                  />
                </div>
                <p className="text-gray-600">{career.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">
            Powered by AI to help you find your perfect career path
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;