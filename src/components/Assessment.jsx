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
  const { logout } = useAuth();

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
    // ... existing handleNextQuestion code ...
  };

  const handleFinish = async (finalAnswers) => {
    // ... existing handleFinish code ...
  };

  const handleSkipQuestion = async () => {
    // ... existing handleSkipQuestion code ...
  };

  const handleWebCareerSearch = async () => {
    // ... existing handleWebCareerSearch code ...
  };

  const handleLogout = async () => {
    try {
      await logout();
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
        {/* ... rest of your assessment UI code ... */}
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