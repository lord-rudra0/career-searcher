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
  Loader2,
  XCircle
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
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  useEffect(() => {
    // Initialize with predefined questions
    setAllQuestions(questionsData.predefinedQuestions);
  }, []);

  const handleSelectAnswer = (option) => {
    setCurrentAnswer(option);
    setError(null);
  };

  const generateNextAIQuestion = async (previousAnswers, retryCount = 0) => {
    try {
      // Check if server is reachable
      const isServerAvailable = await checkServerConnection();
      if (!isServerAvailable) {
        throw new Error('Unable to connect to server');
      }

      console.log('=== Generating New AI Question ===');
      console.log('Based on previous Q&A:', previousAnswers);

      const response = await api.post('/generate-question', {
        previousQA: previousAnswers
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      if (response.data.question) {
        const aiQuestion = {
          id: allQuestions.length + 1,
          question: response.data.question.question,
          type: 'mcq',
          options: response.data.question.options
        };

        console.log('\nNew AI Generated Question:', aiQuestion);
        setAllQuestions(prev => [...prev, aiQuestion]);
        return true;
      }
      return false;

    } catch (err) {
      console.error('Error generating AI question:', err);

      // Retry logic for connection issues
      if (retryCount < 3 && (err.message.includes('disconnected') || err.message.includes('connect'))) {
        console.log(`Retrying... Attempt ${retryCount + 1} of 3`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return generateNextAIQuestion(previousAnswers, retryCount + 1);
      }

      setError(err.message || 'Failed to generate next question');
      return false;
    }
  };

  const checkServerConnection = async () => {
    try {
      await api.get('/health'); // Add a health check endpoint to your backend
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleNextQuestion = async () => {
    if (!currentAnswer) {
      setError('Please select an answer before continuing');
      return;
    }

    setIsLoading(true);
    setError(null);

    let loaderTimeout = setTimeout(() => {
      setShowLoader(true);
    }, 5000);

    try {
      const currentQ = allQuestions[currentQuestionIndex];
      const newAnswer = {
        question: currentQ.question,
        answer: currentAnswer
      };

      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);

      // Generate AI question after predefined questions
      if (currentQuestionIndex >= questionsData.predefinedQuestions.length - 1 &&
        allQuestions.length < 20) {

        setIsGeneratingQuestion(true);
        const success = await generateNextAIQuestion(updatedAnswers);

        if (!success) {
          throw new Error('Failed to generate next question. Please try again.');
        }
      }

      // Proceed to next question with error handling
      if (currentQuestionIndex < allQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer('');
      } else if (updatedAnswers.length >= 20) {
        await handleFinish(updatedAnswers);
      }

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      clearTimeout(loaderTimeout);
      setIsLoading(false);
      setShowLoader(false);
      setIsGeneratingQuestion(false);
    }
  };

  const handleFinish = async (finalAnswers) => {
    console.log('\n=== Starting Final Analysis ===');
    console.log('Total Questions Answered:', finalAnswers.length);
    console.log('All Questions and Answers:');
    finalAnswers.forEach((qa, index) => {
      console.log(`\nQ${index + 1}: ${qa.question}`);
      console.log(`A${index + 1}: ${qa.answer}`);
    });

    setIsAnalyzing(true);
    try {
      const response = await api.post('/analyze-answers', {
        answers: finalAnswers
      });
      setCareerResults(response.data.careers);
      console.log('\nAnalysis Complete');
      console.log('Career Results:', response.data.careers);
    } catch (err) {
      console.error('Error analyzing answers:', err);
      setError('Failed to analyze answers');
    } finally {
      setIsAnalyzing(false);
      console.log('=== End of Analysis ===\n');
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
          <p className="mt-4 text-gray-700">
            {isGeneratingQuestion
              ? "AI is generating your next question..."
              : "Taking longer than expected..."}
          </p>
          <div className="mt-3 flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Update the progress display in the header
  const getProgressText = () => {
    if (currentQuestionIndex < questionsData.predefinedQuestions.length) {
      return `Predefined Question ${currentQuestionIndex + 1} of 10`;
    } else {
      return `AI Question ${currentQuestionIndex - 9} of 10`;
    }
  };

  const ErrorMessage = ({ error, onRetry }) => (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded animate-fade-in">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <XCircle className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm">{error}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      )}
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
              <div className="flex flex-col items-end">
                <div className="text-sm text-gray-600 mb-1">
                  {getProgressText()}
                </div>
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${(currentQuestionIndex + 1) * 5}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 pt-28 pb-20">
          {showLoader && <LoadingSpinner />}

          {error && (
            <ErrorMessage
              error={error}
              onRetry={() => {
                setError(null);
                handleNextQuestion();
              }}
            />
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
                        {isGeneratingQuestion ? 'Generating...' : 'Loading...'}
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
            <div className="flex flex-col items-end">
              <div className="text-sm text-gray-600 mb-1">
                {getProgressText()}
              </div>
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${(currentQuestionIndex + 1) * 5}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 pt-28 pb-20">
        {showLoader && <LoadingSpinner />}

        {error && (
          <ErrorMessage
            error={error}
            onRetry={() => {
              setError(null);
              handleNextQuestion();
            }}
          />
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
                      {isGeneratingQuestion ? 'Generating...' : 'Loading...'}
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