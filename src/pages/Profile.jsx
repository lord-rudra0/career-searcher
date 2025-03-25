import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, BookOpen, Calendar, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

function Profile() {
  const { user } = useAuth();
  const [assessmentResults, setAssessmentResults] = useState([]);

  useEffect(() => {
    if (user) {
      const storedResults = JSON.parse(localStorage.getItem('careerResults') || '[]');
      console.log('Loaded stored results:', storedResults);
      setAssessmentResults(storedResults);
    }
  }, [user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-28 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Assessment History
              </h1>
              <p className="text-gray-600 mt-2">
                View your past career assessments and recommendations
              </p>
            </div>

            {assessmentResults.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-600 mb-6">No assessment results found. Take a career assessment to see your results here!</p>
                <Link 
                  to="/test" 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Take Assessment
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {assessmentResults.map((result, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <span className="text-sm text-gray-600">
                          {formatDate(result.timestamp)}
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {result.group}
                      </span>
                    </div>

                    {/* AI Generated Careers */}
                    <div className="mb-6">
                      <h3 className="flex items-center text-lg font-semibold mb-4">
                        <Sparkles className="w-5 h-5 text-yellow-500 mr-2" />
                        AI Recommendations
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {result.aiCareers.map((career, careerIndex) => (
                          <div 
                            key={careerIndex}
                            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-gray-800">{career.title}</h4>
                              <span className="text-sm text-blue-600">{career.match}% Match</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{career.description}</p>
                            {career.roadmap && (
                              <div className="mt-3">
                                <h5 className="text-sm font-medium text-gray-700 mb-1">Career Path:</h5>
                                <ul className="text-sm text-gray-600 list-disc list-inside">
                                  {career.roadmap.map((step, stepIndex) => (
                                    <li key={stepIndex}>{step}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PDF Based Careers */}
                    {result.pdfCareers && result.pdfCareers.length > 0 && (
                      <div>
                        <h3 className="flex items-center text-lg font-semibold mb-4">
                          <BookOpen className="w-5 h-5 text-blue-500 mr-2" />
                          PDF-Based Matches
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {result.pdfCareers.map((career, careerIndex) => (
                            <div 
                              key={careerIndex}
                              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium text-gray-800">{career.title}</h4>
                                <span className="text-sm text-blue-600">{career.match}% Match</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">{career.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default Profile;
