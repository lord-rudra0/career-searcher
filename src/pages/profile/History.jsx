import React, { useEffect, useState } from 'react';
import { Calendar, Sparkles, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function History() {
  const { user } = useAuth();
  const [assessmentResults, setAssessmentResults] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      try {
        const { results } = await api.getUserAnalysisResults(10);
        if (Array.isArray(results) && results.length > 0) {
          const normalized = results.map(r => ({
            timestamp: r.createdAt,
            group: r.groupName,
            aiCareers: r.aiCareers || [],
            pdfCareers: r.pdfCareers || []
          }));
          setAssessmentResults(normalized);
          return;
        }
      } catch (e) {
        // Fallback to localStorage if server history not available
      }
      const storedResults = JSON.parse(localStorage.getItem('careerResults') || '[]');
      setAssessmentResults(storedResults);
    };
    loadHistory();
  }, [user]);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  if (assessmentResults.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600 mb-6">No assessment results found. Take a career assessment to see your results here!</p>
        <Link to="/test" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Take Assessment</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Assessment History</h1>
      <div className="space-y-8">
        {assessmentResults.map((result, index) => (
          <div key={index} className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600">{formatDate(result.timestamp)}</span>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{result.group}</span>
            </div>

            <div className="mb-6">
              <h3 className="flex items-center text-lg font-semibold mb-4">
                <Sparkles className="w-5 h-5 text-yellow-500 mr-2" />
                AI Recommendations
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {result.aiCareers.map((career, careerIndex) => (
                  <div key={careerIndex} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-800">{career.title}</h4>
                      <span className="text-sm text-blue-600">{career.match ?? 0}% Match</span>
                    </div>
                    {career.description && <p className="text-sm text-gray-600 mt-2">{career.description}</p>}
                  </div>
                ))}
              </div>
            </div>

            {result.pdfCareers && result.pdfCareers.length > 0 && (
              <div>
                <h3 className="flex items-center text-lg font-semibold mb-4">
                  <BookOpen className="w-5 h-5 text-blue-500 mr-2" />
                  PDF-Based Matches
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {result.pdfCareers.map((career, careerIndex) => (
                    <div key={careerIndex} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-800">{career.title}</h4>
                        <span className="text-sm text-blue-600">{career.match ?? 0}% Match</span>
                      </div>
                      {career.description && <p className="text-sm text-gray-600 mt-2">{career.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
