import React, { useState, useEffect, useRef } from 'react';
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
  Search,
  Globe,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import questionsData from '../questions.json';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CareerRoadmap from './CareerRoadmap';
import LoadingSpinner from './LoadingSpinner';
// import ChatBot from './ChatBot'
import Navbar from './Navbar';
import Footer from './Footer';
import { useSearchParams } from 'react-router-dom';

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
  const [webSearchResults, setWebSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [webCareerResults, setWebCareerResults] = useState(null);
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [pdfCareerResults, setPdfCareerResults] = useState(null);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState(null);
  // Analysis control
  const [elapsedSec, setElapsedSec] = useState(0);
  const controllerRef = useRef(null);
  const timerRef = useRef(null);

  // Map stored groupType to option id used by questions.json
  const groupTypeToOption = (groupType) => {
    if (!groupType || typeof groupType !== 'string') return null;
    const g = groupType.trim().toLowerCase();
    if (g.includes('9-10') || (g.includes('9') && g.includes('10'))) return 1;
    if (g.includes('11-12') || (g.includes('11') && g.includes('12'))) return 2;
    if (g.includes('undergraduate') || g.includes('under graduate') || g === 'ug' || g.includes('college')) return 3;
    if (g.includes('postgraduate') || g.includes('post graduate') || g === 'pg') return 4;
    switch (groupType) {
      case 'Class 9-10': return 1;
      case 'Class 11-12': return 2;
      case 'UnderGraduate Student':
      case 'Undergraduate Student':
      case 'College Student': return 3;
      case 'PostGraduate':
      case 'Post Graduate':
      case 'PG': return 4;
      default: return null;
    }
  };

  const handleCancelAnalysis = () => {
    try {
      controllerRef.current?.abort();
    } catch {}
    setIsAnalyzing(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => {
    const option = searchParams.get('option');
    let selectedQuestions = [];
    let currentGroupName = null;

    if (option) {
      const optionNumber = parseInt(option, 10);
      if (questionsData.predefinedQuestions[optionNumber]) {
        selectedQuestions = questionsData.predefinedQuestions[optionNumber];
        console.log(`Loaded questions for option ${optionNumber}`);

        switch (optionNumber) {
          case 1:
            currentGroupName = "Class 9-10";
            break;
          case 2:
            currentGroupName = "Class 11-12";
            break;
          case 3:
            currentGroupName = "UnderGraduate Student";
            break;
          case 4:
            currentGroupName = "PostGraduate";
            break;
          default:
            currentGroupName = "Unknown Group";
        }
      } else {
        console.error(`Option ${optionNumber} not found in questions.json`);
        setError("Failed to load questions for selected option.");
        return;
      }
    } else {
      // No option in URL, try to infer from logged-in user's groupType
      const inferred = groupTypeToOption(user?.groupType);
      const optionNumber = inferred || 1;
      if (questionsData.predefinedQuestions[optionNumber]) {
        selectedQuestions = questionsData.predefinedQuestions[optionNumber];
        switch (optionNumber) {
          case 1: currentGroupName = "Class 9-10"; break;
          case 2: currentGroupName = "Class 11-12"; break;
          case 3: currentGroupName = "UnderGraduate Student"; break;
          case 4: currentGroupName = "PostGraduate"; break;
          default: currentGroupName = "Class 9-10";
        }
        console.log(`Loaded ${inferred ? 'inferred' : 'default'} questions (option ${optionNumber})`);
      } else {
        console.error(`Fallback option ${optionNumber} not found in questions.json`);
        setError("Failed to load questions.");
        return;
      }
    }
    setAllQuestions(selectedQuestions);
    setGroupName(currentGroupName);
  }, [searchParams, user]);

  const handleSelectAnswer = (option) => {
    setCurrentAnswer(option);
    setError(null);
  };

  const generateNextAIQuestion = async (previousAnswers) => {
    try {
      // Log previous questions and answers
      console.log('=== Generating New AI Question ===');
      console.log('Based on previous Q&A:');
      previousAnswers.forEach((qa, index) => {
        console.log(`\nQ${index + 1}: ${qa.question}`);
        console.log(`A${index + 1}: ${qa.answer}`);
      });
      console.log('\n-------------------');

      // Use api instead of apiInstance
      const response = await api.generateQuestion(previousAnswers);

      if (response && response.question) {
        const aiQuestion = {
          id: allQuestions.length + 1,
          question: response.question.question,
          type: 'mcq',
          options: response.question.options
        };

        // Log the newly generated question
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
      // Log current question and answer
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

      // Generate AI question after predefined questions are finished
      if (currentQuestionIndex >= allQuestions.length - 1) {
        if (updatedAnswers.length < 20) {
          console.log('\nStarting AI Question Generation');
          console.log('Predefined Questions Completed:', allQuestions.length);
          console.log('Current Total Answers:', updatedAnswers.length);

          setIsGeneratingQuestion(true);
          const success = await generateNextAIQuestion(updatedAnswers);

          if (!success) {
            throw new Error('Failed to generate next question. Please try again.');
          }
        } else {
          console.log('\nMaximum AI questions reached, proceeding to analysis');
          handleFinish(updatedAnswers);
          return;
        }
      }

      // Proceed to next question if not the last question of the current set
      if (currentQuestionIndex < allQuestions.length - 1) {
        console.log('\nMoving to next question');
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer('');
      } else {
        console.log('\nEnd of predefined questions, potentially moving to AI or analysis');
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

  const handleFinish = async (finalAnswers) => {
    console.log('\n=== Starting Final Analysis ===');
    console.log('Selected Group:', groupName);
    console.log('Total Questions Answered:', finalAnswers.length);

    setIsAnalyzing(true);
    setElapsedSec(0);
    // Setup cancellation and timer
    controllerRef.current = new AbortController();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    try {
      const response = await api.analyzeAnswers(
        finalAnswers,
        groupName,
        user?.preferences,
        {
          retries: 2,
          backoffMs: 2000,
          signal: controllerRef.current.signal,
          timeoutMs: 130000
        }
      );
      
      if (!response.ai_generated_careers || !response.pdf_based_careers) {
        throw new Error('Invalid response format');
      }
      
      setCareerResults(response.ai_generated_careers);
      setPdfCareerResults(response.pdf_based_careers);

      // Store results in localStorage
      const resultData = {
        timestamp: new Date().toISOString(),
        group: groupName,
        aiCareers: response.ai_generated_careers,
        pdfCareers: response.pdf_based_careers
      };

      // Get existing results or initialize empty array
      const existingResults = JSON.parse(localStorage.getItem('careerResults') || '[]');
      
      // Add new result to the beginning of the array
      existingResults.unshift(resultData);
      
      // Keep only the last 10 results
      const updatedResults = existingResults.slice(0, 10);
      
      // Save to localStorage
      localStorage.setItem('careerResults', JSON.stringify(updatedResults));

      console.log('Analysis Complete and Results Stored');
      console.log('Stored Data:', resultData);
      
    } catch (err) {
      console.error('Analysis error:', err);
      if (err.name === 'CanceledError' || /cancel/i.test(err.message)) {
        setError('Analysis was cancelled');
      } else {
        setError(err.message || 'Failed to analyze answers');
      }
    } finally {
      setIsAnalyzing(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      controllerRef.current = null;
    }
  };

  // Cleanup on unmount: abort any in-flight analysis
  useEffect(() => {
    return () => {
      try { controllerRef.current?.abort(); } catch {}
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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

  const handleWebSearch = async () => {
    if (!careerResults) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await api.webSearch([careerResults]);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setWebSearchResults(response.data.results);
    } catch (err) {
      console.error('Web search error:', err);
      setError('Failed to perform web search');
    } finally {
      setIsSearching(false);
    }
  };

  const handleWebCareerSearch = async () => {
    setIsWebSearching(true);
    setError(null);

    try {
      // Send the analysis summary to backend for web search
      const response = await api.searchWebCareers(careerResults.analysis);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setWebCareerResults(response.data.careers);
    } catch (err) {
      console.error('Web career search error:', err);
      setError('Failed to search additional careers');
    } finally {
      setIsWebSearching(false);
    }
  };

  const LogoAnimation = () => (
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 animate-spin-slow">
        <Sparkles className="w-6 h-6 text-yellow-400 absolute top-0 left-1/2 transform -translate-x-1/2" />
        <Star className="w-6 h-6 text-blue-400 absolute bottom-0 left-1/2 transform -translate-x-1/2" />
      </div>
      <Rocket className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
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

  const CareerSection = ({ title, careers, icon: Icon }) => {
    // Add validation for careers array
    if (!careers || !Array.isArray(careers)) {
        return null;
    }

    return (
        <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Icon className="w-6 h-6 mr-2" />
                {title}
            </h2>
            <div className="space-y-6">
                {careers.map((career, index) => {
                    // Ensure career object has all required properties
                    const careerData = {
                        ...career,
                        roadmap: career.roadmap || [
                            "Entry Level: Required skills and certifications",
                            "Mid Level: Advanced skills and experience",
                            "Senior Level: Expert knowledge and leadership"
                        ],
                        colleges: career.colleges || [
                            {
                                name: "Recommended University",
                                program: "Related Degree Program",
                                duration: "4 years",
                                location: "Various Locations"
                            }
                        ]
                    };

                    return (
                        <div 
                            key={index}
                            className="bg-white rounded-lg shadow-md p-6 transform hover:scale-102 transition-all duration-200"
                            style={{ animationDelay: `${index * 200}ms` }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-semibold text-blue-600">
                                    {careerData.title || 'Career Option'}
                                </h3>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                                    {careerData.match || 0}% Match
                                </span>
                            </div>
                            <p className="text-gray-600 mb-4">
                                {careerData.description || 'No description available'}
                            </p>
                            
                            <CareerRoadmap career={careerData} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  if (careerResults) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <Navbar />
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
              <p className="mt-2 text-lg text-gray-700">Analyzing your responses... This may take up to ~2 minutes.</p>
              <p className="mt-1 text-sm text-gray-500">Elapsed: {elapsedSec}s</p>
              <button
                onClick={handleCancelAnalysis}
                className="mt-4 inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow-sm"
              >
                Cancel
              </button>
            </div>
          )}

          {careerResults && (
            <>
              <CareerSection 
                title="AI-Generated Career Recommendations" 
                careers={careerResults} 
                icon={Sparkles}
              />
              
              {pdfCareerResults && (
                <CareerSection 
                  title="PDF-Based Career Matches" 
                  careers={pdfCareerResults} 
                  icon={BookOpen}
                />
              )}

              
            </>
          )}
        </main>

        <Footer />
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navbar />
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
            <p className="mt-2 text-lg text-gray-700">Analyzing your responses... This may take up to ~2 minutes.</p>
            <p className="mt-1 text-sm text-gray-500">Elapsed: {elapsedSec}s</p>
            <button
              onClick={handleCancelAnalysis}
              className="mt-4 inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {careerResults && (
          <>
            <CareerSection 
              title="AI-Generated Career Recommendations" 
              careers={careerResults} 
              icon={Sparkles}
            />
            
            {pdfCareerResults && (
              <CareerSection 
                title="PDF-Based Career Matches" 
                careers={pdfCareerResults} 
                icon={BookOpen}
              />
            )}

            <div className="max-w-3xl mx-auto animate-slide-up">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <Award className="w-8 h-8 text-yellow-400 animate-bounce" />
                  <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Your Career Matches
                  </h2>
                </div>
                <button
                  onClick={handleWebSearch}
                  disabled={isSearching}
                  className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-blue-600"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Find More Careers
                    </>
                  )}
                </button>
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">AI-Generated Career Recommendations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {careerResults.map((career, index) => (
                    <div
                      key={index}
                      className="bg-white p-6 rounded-lg shadow-md"
                    >
                      <h3 className="text-xl font-semibold">{career.title}</h3>
                      <div className="mt-2">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${career.match}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm font-medium">{career.match}%</span>
                        </div>
                      </div>
                      <p className="mt-4 text-gray-600">{career.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-4 mt-8">PDF-Based Career Matches</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pdfCareerResults && pdfCareerResults.map((career, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold">{career.title}</h3>
                    <div className="mt-2">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${career.match}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium">{career.match}%</span>
                      </div>
                    </div>
                    <p className="mt-4 text-gray-600">{career.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Web Search Results Section */}
            {webSearchResults && (
              <div className="max-w-3xl mx-auto mt-12 animate-slide-up">
                <div className="flex items-center space-x-3 mb-8">
                  <Search className="w-7 h-7 text-blue-500" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    Additional Career Suggestions
                  </h2>
                </div>

                <div className="space-y-6">
                  {webSearchResults.map((result, index) => (
                    <div
                      key={index}
                      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {result.title}
                        </h3>
                        <span className="text-sm text-blue-600 font-medium">
                          {result.relevance}% Match
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{result.description}</p>
                      {result.link && (
                        <a
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-blue-500 hover:text-blue-700"
                        >
                          Learn More
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Web Search Button - Centered and Prominent */}
            <div className="max-w-3xl mx-auto mt-8 text-center">
              <button
                onClick={handleWebCareerSearch}
                disabled={isWebSearching}
                className="group relative inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-102 disabled:opacity-50"
              >
                {isWebSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Searching Web...
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    Discover More Careers Online
                  </>
                )}
              </button>
            </div>

            {/* Web Search Results Section */}
            {webCareerResults && (
              <div className="max-w-3xl mx-auto mt-12 mb-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <BookOpen className="w-6 h-6 text-blue-500" />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Web Career Suggestions
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {webCareerResults.map((career, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 animate-slide-up"
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {career.title}
                          </h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                            {career.matchScore}% Match
                          </span>
                        </div>

                        <p className="mt-3 text-gray-600">
                          {career.description}
                        </p>

                        {career.keySkills && (
                          <div className="mt-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              Key Skills:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {career.keySkills.map((skill, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-sm"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

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
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;