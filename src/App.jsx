import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Star,
  ChevronRight,
  SkipForward,
  Rocket,
  Target,
  Compass,
  Zap,
  Award,
  Sparkle,
  Loader2
} from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

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

    setIsLoading(true);
    setError(null);

    // Set up loader timeout
    const loaderTimeout = setTimeout(() => {
      setShowLoader(true);
    }, 5000); // Show loader after 5 seconds

    try {
      const currentQ = allQuestions[currentQuestionIndex];
      const newAnswer = {
        question: currentQ.question,
        answer: currentAnswer
      };

      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);

      if (currentQuestionIndex >= questionsData.predefinedQuestions.length - 1 &&
        allQuestions.length < 20) {
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
      }

      if (currentQuestionIndex < allQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer('');
      } else if (updatedAnswers.length >= 20) {
        handleFinish(updatedAnswers);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to proceed to next question. Please try again.');
    } finally {
      clearTimeout(loaderTimeout); // Clear the timeout
      setIsLoading(false);
      setShowLoader(false);
    }
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

  const handleSkipQuestion = async () => {
    setIsLoading(true);

    const loaderTimeout = setTimeout(() => {
      setShowLoader(true);
    }, 5000);

    try {
      if (currentQuestionIndex < allQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer('');
        setError(null);
      }
    } finally {
      clearTimeout(loaderTimeout);
      setIsLoading(false);
      setShowLoader(false);
    }
  };

  const LoadingAnimation = () => (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
    </div>
  );

  const LogoAnimation = () => (
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 animate-spin-slow">
        <Sparkles className="w-6 h-6 text-yellow-400 absolute top-0 left-1/2 transform -translate-x-1/2" />
        <Star className="w-6 h-6 text-blue-400 absolute bottom-0 left-1/2 transform -translate-x-1/2" />
      </div>
      <Rocket className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    </div>
  );

  // Loading animation components
  const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg p-8 shadow-xl">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="mt-4 text-gray-700">Taking longer than expected...</p>
          <div className="mt-3 flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (careerResults) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-lg py-4 px-6 fixed w-full top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LogoAnimation />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                  Career Compass
                </h1>
                <p className="text-sm text-gray-500">Discover Your Perfect Path</p>
              </div>
            </div>
            {!careerResults && (
              <div className="flex items-center space-x-2">
                <div className="h-2 w-32 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${(currentQuestionIndex + 1) * 5}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">
                  {currentQuestionIndex + 1}/20
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 pt-28 pb-20">
          {showLoader && <LoadingSpinner />}

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded animate-shake">
              {error}
            </div>
          )}

          {!careerResults && currentQuestionIndex < allQuestions.length && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl animate-float">
                <div className="flex items-center space-x-2 mb-6">
                  <Target className="w-6 h-6 text-indigo-500 animate-pulse" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    {allQuestions[currentQuestionIndex]?.question}
                  </h2>
                </div>
                <div className="space-y-3">
                  {allQuestions[currentQuestionIndex]?.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(option)}
                      disabled={isLoading}
                      className={`w-full p-4 text-left rounded-xl transition-all duration-300 transform hover:scale-102 hover:shadow-md flex items-center space-x-3 ${currentAnswer === option
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                        : 'bg-white hover:bg-gray-50 text-gray-700'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentAnswer === option ? 'bg-white/20' : 'bg-gray-100'
                        }`}>
                        {index + 1}
                      </div>
                      <span>{option}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-8 space-x-4">
                  <button
                    onClick={handleSkipQuestion}
                    disabled={isLoading}
                    className={`flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 group ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    <SkipForward className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                    Skip
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={!currentAnswer || isLoading}
                    className={`flex items-center px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 group ${!currentAnswer || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : currentQuestionIndex < 19 ? (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    ) : (
                      'Complete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-20 animate-fade-in">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <Compass className="w-20 h-20 text-blue-500 animate-spin-slow" />
                <Zap className="w-8 h-8 text-yellow-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <p className="mt-4 text-xl text-gray-700">Analyzing your responses...</p>
              <LoadingAnimation />
            </div>
          )}

          {careerResults && (
            <div className="max-w-3xl mx-auto animate-slide-up">
              <div className="flex items-center justify-center mb-8 space-x-3">
                <Award className="w-8 h-8 text-yellow-400 animate-bounce" />
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Your Career Matches
                </h2>
              </div>
              {careerResults.map((career, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 transform transition-all duration-300 hover:shadow-xl hover:scale-102"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 mr-2" />
                    {career.title}
                  </h3>
                  <div className="mt-3 mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Match Score</span>
                      <span className="text-sm font-bold text-blue-600">{career.match}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 animate-width"
                        style={{ width: `${career.match}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-gray-600">{career.description}</p>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="text-gray-400">Powered by Advanced AI</span>
            </div>
            <p className="text-sm text-gray-400">
              Guiding you towards your ideal career path
            </p>
          </div>
        </footer>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg py-4 px-6 fixed w-full top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <LogoAnimation />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                Career Compass
              </h1>
              <p className="text-sm text-gray-500">Discover Your Perfect Path</p>
            </div>
          </div>
          {!careerResults && (
            <div className="flex items-center space-x-2">
              <div className="h-2 w-32 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentQuestionIndex + 1) * 5}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">
                {currentQuestionIndex + 1}/20
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 pt-28 pb-20">
        {showLoader && <LoadingSpinner />}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded animate-shake">
            {error}
          </div>
        )}

        {!careerResults && currentQuestionIndex < allQuestions.length && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl animate-float">
              <div className="flex items-center space-x-2 mb-6">
                <Target className="w-6 h-6 text-indigo-500 animate-pulse" />
                <h2 className="text-2xl font-bold text-gray-800">
                  {allQuestions[currentQuestionIndex]?.question}
                </h2>
              </div>
              <div className="space-y-3">
                {allQuestions[currentQuestionIndex]?.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={isLoading}
                    className={`w-full p-4 text-left rounded-xl transition-all duration-300 transform hover:scale-102 hover:shadow-md flex items-center space-x-3 ${currentAnswer === option
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'bg-white hover:bg-gray-50 text-gray-700'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentAnswer === option ? 'bg-white/20' : 'bg-gray-100'
                      }`}>
                      {index + 1}
                    </div>
                    <span>{option}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8 space-x-4">
                <button
                  onClick={handleSkipQuestion}
                  disabled={isLoading}
                  className={`flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 group ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  <SkipForward className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                  Skip
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={!currentAnswer || isLoading}
                  className={`flex items-center px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 group ${!currentAnswer || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : currentQuestionIndex < 19 ? (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    'Complete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-20 animate-fade-in">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Compass className="w-20 h-20 text-blue-500 animate-spin-slow" />
              <Zap className="w-8 h-8 text-yellow-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="mt-4 text-xl text-gray-700">Analyzing your responses...</p>
            <LoadingAnimation />
          </div>
        )}

        {careerResults && (
          <div className="max-w-3xl mx-auto animate-slide-up">
            <div className="flex items-center justify-center mb-8 space-x-3">
              <Award className="w-8 h-8 text-yellow-400 animate-bounce" />
              <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Your Career Matches
              </h2>
            </div>
            {careerResults.map((career, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 transform transition-all duration-300 hover:shadow-xl hover:scale-102"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-2" />
                  {career.title}
                </h3>
                <div className="mt-3 mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Match Score</span>
                    <span className="text-sm font-bold text-blue-600">{career.match}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 animate-width"
                      style={{ width: `${career.match}%` }}
                    />
                  </div>
                </div>
                <p className="text-gray-600">{career.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span className="text-gray-400">Powered by Advanced AI</span>
          </div>
          <p className="text-sm text-gray-400">
            Guiding you towards your ideal career path
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;