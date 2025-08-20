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
import { useSearchParams, useNavigate } from 'react-router-dom';
import SkillGapPanel from './SkillGapPanel';
import ResultsSnapshot from './ResultsSnapshot';

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
  // Total target questions: predefined + AI-generated
  const MAX_QUESTIONS = 20;
  const [webSearchResults, setWebSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [webCareerResults, setWebCareerResults] = useState(null);
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [pdfCareerResults, setPdfCareerResults] = useState(null);
  const [skillGapData, setSkillGapData] = useState(null);
  const [isSkillGapLoading, setIsSkillGapLoading] = useState(false);
  const [skillGapError, setSkillGapError] = useState(null);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState(null);
  // Analysis control
  const [elapsedSec, setElapsedSec] = useState(0);
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const [lastFinalAnswers, setLastFinalAnswers] = useState([]);
  const navigate = useNavigate();

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

  const handleSkillGapAnalysis = async () => {
    if (!lastFinalAnswers?.length) {
      setSkillGapError('Missing answers context to run skill gap analysis.');
      return;
    }
    setSkillGapError(null);
    setIsSkillGapLoading(true);
    setSkillGapData(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const targetCareers = Array.isArray(careerResults)
        ? careerResults.slice(0, 3).map(c => c.title).filter(Boolean)
        : [];

      const payload = {
        final_answers: lastFinalAnswers,
        group_name: groupName,
        preferences: user?.preferences,
        target_careers: targetCareers,
      };

      const data = await api.skillGapAnalysis(payload, {
        retries: 1,
        backoffMs: 1500,
        signal: controller.signal,
        timeoutMs: 130000,
      });
      setSkillGapData(data);
      if (data?.savedId) {
        // Navigate to dedicated page to view the saved analysis
        navigate(`/skill-gap/${data.savedId}`);
      }
    } catch (err) {
      setSkillGapError(err.message || 'Failed to generate skill gap analysis');
    } finally {
      setIsSkillGapLoading(false);
      controllerRef.current = null;
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
        if (updatedAnswers.length < MAX_QUESTIONS) {
          console.log('\nStarting AI Question Generation');
          console.log('Predefined Questions Completed:', allQuestions.length);
          console.log('Current Total Answers:', updatedAnswers.length);

          setIsGeneratingQuestion(true);
          const success = await generateNextAIQuestion(updatedAnswers);

          if (!success) {
            throw new Error('Failed to generate next question. Please try again.');
          }
          // Move to the newly generated AI question immediately
          setCurrentQuestionIndex(prev => prev + 1);
          setCurrentAnswer('');
          return; // avoid running the below navigation logic in the same tick
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
      setLastFinalAnswers(finalAnswers);

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
                            className="bg-card rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200"
                            style={{ animationDelay: `${index * 200}ms` }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-semibold text-foreground">
                                    {careerData.title || 'Career Option'}
                                </h3>
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                    {careerData.match || 0}% Match
                                </span>
                            </div>
                            <p className="text-foreground/70 mb-4">
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


  const currentQuestion = allQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-20">
        {showLoader && <LoadingSpinner />}

        {error && (
          <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 mb-4 rounded animate-shake">
            {error}
          </div>
        )}

        {!careerResults && currentQuestionIndex < allQuestions.length && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl animate-float">
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>{answers.length} / {MAX_QUESTIONS}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((answers.length / MAX_QUESTIONS) * 100, 100)}%` }}
                  />
                </div>
              </div>
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
                  ) : currentQuestionIndex < MAX_QUESTIONS - 1 ? (
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-card rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center border">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <Compass className="w-24 h-24 text-primary animate-spin-slow" />
                <Zap className="w-9 h-9 text-accent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Analyzing your responses</h3>
              <p className="mt-2 text-sm text-muted-foreground">This may take up to ~2 minutes. Please keep this tab open.</p>
              <p className="mt-1 text-sm text-muted-foreground">Elapsed: {elapsedSec}s</p>
              <div className="mt-6">
                <button
                  onClick={handleCancelAnalysis}
                  className="inline-flex items-center px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {careerResults && (
          <>
            {/* Top bar action: prominent Skill Gap Analysis button */}
            <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Award className="w-8 h-8 text-accent" />
                <h2 className="text-2xl font-bold text-foreground">Your Career Results</h2>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSkillGapAnalysis}
                  disabled={isSkillGapLoading}
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg shadow hover:shadow-md transition disabled:opacity-60"
                >
                  {isSkillGapLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Skill Gap Analysis
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate('/skill-gap')}
                  className="inline-flex items-center px-3 py-2 bg-card text-foreground rounded-lg border hover:bg-muted/40"
                >
                  View Saved
                </button>
              </div>
            </div>

            {/* Results Snapshot: Radar + Heatmap */}
            <div className="max-w-5xl mx-auto mb-10 animate-slide-up">
              <ResultsSnapshot
                careers={careerResults}
                labels={{
                  logic: 'Technical',
                  creativity: 'Creative',
                  social: 'Communication',
                  organization: 'Management',
                }}
              />
            </div>

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

            <div className="max-w-5xl mx-auto animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Award className="w-8 h-8 text-accent animate-bounce" />
                  <h2 className="text-3xl font-bold text-center bg-gradient-primary bg-clip-text text-transparent">
                    Your Career Matches
                  </h2>
                </div>
                <button
                  onClick={handleWebSearch}
                  disabled={isSearching}
                  className="inline-flex items-center px-3 py-2 bg-secondary text-foreground rounded-lg border hover:bg-secondary/80 disabled:opacity-60"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Explore on Web
                </button>
              </div>
            </div>

            {/* Web Search Results Section */}
            {webSearchResults && (
              <div className="max-w-5xl mx-auto mt-10 animate-slide-up">
                <div className="flex items-center space-x-3 mb-6">
                  <Search className="w-7 h-7 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">
                    Additional Career Suggestions
                  </h2>
                </div>

                <div className="space-y-6">
                  {webSearchResults.map((result, index) => (
                    <div
                      key={index}
                      className="bg-card rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {result.title}
                        </h3>
                        <span className="text-sm px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                          {result.relevance}% Match
                        </span>
                      </div>
                      <p className="text-foreground/70 mb-3">{result.description}</p>
                      {result.link && (
                        <a
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-primary hover:text-primary/80"
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
            <div className="max-w-5xl mx-auto mt-8 text-center">
              <button
                onClick={handleWebCareerSearch}
                disabled={isWebSearching}
                className="group relative inline-flex items-center justify-center px-8 py-3 bg-primary text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-102 disabled:opacity-50"
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
              <div className="max-w-5xl mx-auto mt-12 mb-8">
                <div className="bg-card rounded-2xl shadow-xl p-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <BookOpen className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">
                      Web Career Suggestions
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {webCareerResults.map((career, index) => (
                      <div
                        key={index}
                        className="bg-card rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 animate-slide-up"
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-semibold text-foreground">
                            {career.title}
                          </h3>
                          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                            {career.matchScore}% Match
                          </span>
                        </div>

                        <p className="mt-3 text-foreground/70">
                          {career.description}
                        </p>

                        {career.keySkills && (
                          <div className="mt-3">
                            <h4 className="text-sm font-semibold text-foreground mb-2">
                              Key Skills:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {career.keySkills.map((skill, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className="px-2 py-1 bg-muted text-foreground/80 rounded-md text-sm"
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
                            className="inline-flex items-center mt-4 text-primary hover:text-primary/80 transition-colors"
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