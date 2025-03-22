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
  Loader2,
  Search,
  Globe,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import questionsData from '../questions.json';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Assessment() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [allQuestions, setAllQuestions] = useState(questionsData.predefinedQuestions);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [careerResults, setCareerResults] = useState(null);
  const [pdfCareerResults, setPdfCareerResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [webSearchResults, setWebSearchResults] = useState(null);
  const { logout: authLogout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Add authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/sign-in');
    }
  }, [isAuthenticated, navigate]);

  const generateNextAIQuestion = async (previousAnswers) => {
    try {
      const response = await api.generateQuestion(previousAnswers);

      if (response && response.question) {
        const aiQuestion = {
          id: allQuestions.length + 1,
          question: response.question.question,
          type: 'mcq',
          options: response.question.options
        };

        console.log('\nNew AI Generated Question:');
        console.log('Question:', aiQuestion.question);
        console.log('Options:', aiQuestion.options);
        console.log('=== End of Generation ===\n');

        setAllQuestions(prev => [...prev, aiQuestion]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error generating AI question:', err);
      setError('Failed to generate next question. Please try again.');
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

    const loaderTimeout = setTimeout(() => {
      setShowLoader(true);
    }, 5000);

    try {
      console.log('\n=== Processing Next Question ===');
      console.log('Current Question Index:', currentQuestionIndex);
      console.log('Total Questions:', allQuestions.length);

      const currentQ = allQuestions[currentQuestionIndex];
      const newAnswer = {
        question: currentQ.question,
        answer: currentAnswer
      };

      console.log('\nSaving Current Answer:');
      console.log('Question:', currentQ.question);
      console.log('Selected Answer:', currentAnswer);

      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);

      // Generate AI question after predefined questions
      if (currentQuestionIndex >= questionsData.predefinedQuestions.length - 1 &&
        allQuestions.length < 20) {

        console.log('\nStarting AI Question Generation');
        console.log('Predefined Questions Completed:', questionsData.predefinedQuestions.length);
        console.log('Current Total Questions:', allQuestions.length);

        setIsGeneratingQuestion(true);
        const success = await generateNextAIQuestion(updatedAnswers);

        if (!success) {
          throw new Error('Failed to generate next question. Please try again.');
        }
      }

      // Proceed to next question
      if (currentQuestionIndex < allQuestions.length - 1) {
        console.log('\nMoving to next question');
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer('');
      } else if (updatedAnswers.length >= 20) {
        console.log('\nAll questions completed, proceeding to analysis');
        handleFinish(updatedAnswers);
      }

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      clearTimeout(loaderTimeout);
      setIsLoading(false);
      setShowLoader(false);
      setIsGeneratingQuestion(false);
      console.log('=== End of Processing ===\n');
    }
  };

  const handleSkipQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (currentQuestionIndex < allQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer('');
      } else {
        const success = await generateNextAIQuestion(answers);
        if (!success) {
          throw new Error('Failed to generate next question');
        }
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer('');
      }
    } catch (err) {
      setError(err.message || 'Failed to skip question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async (finalAnswers) => {
    // ... existing handleFinish code ...
  };

  const handleWebCareerSearch = async () => {
    // ... existing handleWebCareerSearch code ...
  };

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const currentQuestion = allQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg py-4 px-6 fixed w-full top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                Career Compass
              </h1>
              <p className="text-sm text-gray-500">Discover Your Perfect Path</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
              <div className="text-sm text-gray-600 mb-1">
                Question {currentQuestionIndex + 1} of {allQuestions.length}
              </div>
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%` }}
                />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {currentQuestion && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4">{currentQuestion.question}</h2>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentAnswer(option)}
                    className={`w-full p-4 text-left rounded-lg transition-all duration-200 ${
                      currentAnswer === option
                        ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                        : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                    } border-2`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={handleSkipQuestion}
                  className="flex items-center text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip Question
                </button>

                <button
                  onClick={handleNextQuestion}
                  disabled={!currentAnswer || isLoading}
                  className={`flex items-center px-6 py-2 rounded-lg ${
                    !currentAnswer || isLoading
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white transition-colors duration-200`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Next Question
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {careerResults && (
          <div className="max-w-4xl mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-yellow-500" />
              Your Career Matches
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {careerResults.map((career, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-102 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-indigo-600">
                      {career.title}
                    </h3>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                      {career.match}% Match
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{career.description}</p>
                  
                  {/* Add CareerRoadmap component */}
                  <CareerRoadmap career={career} />

                  {career.sourceLink && (
                    <a
                      href={career.sourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-4 text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      Learn More
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  )}
                </div>
              ))}
            </div>
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

export default Assessment; 