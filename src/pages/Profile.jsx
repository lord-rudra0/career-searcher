import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, BookOpen, Calendar, Sparkles, Save, MapPin, User as UserIcon, Mail, Globe } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Profile() {
  const { user, refreshUser, isLoading } = useAuth();
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    username: '',
    email: '',
    groupType: '',
    preferences: {
      jobLocation: { country: '', state: '', district: '' },
      studyLocation: { country: '', state: '', district: '' }
    }
  });

  // Initialize form from user
  useEffect(() => {
    if (user) {
      setForm({
        username: user.name || '',
        email: user.email || '',
        groupType: user.groupType || '',
        preferences: {
          jobLocation: {
            country: user.preferences?.jobLocation?.country || '',
            state: user.preferences?.jobLocation?.state || '',
            district: user.preferences?.jobLocation?.district || ''
          },
          studyLocation: {
            country: user.preferences?.studyLocation?.country || '',
            state: user.preferences?.studyLocation?.state || '',
            district: user.preferences?.studyLocation?.district || ''
          }
        }
      });
    }
  }, [user]);

  // Load previous results from backend, fallback to localStorage
  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      try {
        const { results } = await api.getUserAnalysisResults(10);
        if (Array.isArray(results) && results.length > 0) {
          // Normalize to match existing renderer shape
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
        console.warn('Falling back to local history:', e.message);
      }
      const storedResults = JSON.parse(localStorage.getItem('careerResults') || '[]');
      setAssessmentResults(storedResults);
    };
    loadHistory();
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

  const handleChange = (path, value) => {
    setForm(prev => {
      const next = { ...prev };
      const segments = path.split('.');
      let cur = next;
      for (let i = 0; i < segments.length - 1; i++) {
        cur[segments[i]] = cur[segments[i]] ?? {};
        cur = cur[segments[i]];
      }
      cur[segments[segments.length - 1]] = value;
      return next;
    });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.updateUserProfile({
        username: form.username,
        email: form.email,
        groupType: form.groupType,
        preferences: form.preferences
      });
      await refreshUser();
    } catch (e) {
      console.error('Failed to save profile:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-28 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <UserIcon className="w-5 h-5 text-blue-500 mr-2" /> Profile
              </h2>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm text-gray-600 flex items-center"><UserIcon className="w-4 h-4 mr-2"/>Username</span>
                  <input value={form.username} onChange={e=>handleChange('username', e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-600 flex items-center"><Mail className="w-4 h-4 mr-2"/>Email</span>
                  <input type="email" value={form.email} onChange={e=>handleChange('email', e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-600">Group Type</span>
                  <select value={form.groupType} onChange={e=>handleChange('groupType', e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 bg-white">
                    <option value="">Select...</option>
                    <option>Class 9-10</option>
                    <option>Class 11-12</option>
                    <option>UnderGraduate Student</option>
                    <option>PostGraduate</option>
                  </select>
                </label>

                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center"><MapPin className="w-4 h-4 mr-2"/>Job Location</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    <input placeholder="Country" value={form.preferences.jobLocation.country} onChange={e=>handleChange('preferences.jobLocation.country', e.target.value)} className="border rounded-lg px-3 py-2" />
                    <input placeholder="State" value={form.preferences.jobLocation.state} onChange={e=>handleChange('preferences.jobLocation.state', e.target.value)} className="border rounded-lg px-3 py-2" />
                    <input placeholder="District" value={form.preferences.jobLocation.district} onChange={e=>handleChange('preferences.jobLocation.district', e.target.value)} className="border rounded-lg px-3 py-2" />
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center"><Globe className="w-4 h-4 mr-2"/>Study Location</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    <input placeholder="Country" value={form.preferences.studyLocation.country} onChange={e=>handleChange('preferences.studyLocation.country', e.target.value)} className="border rounded-lg px-3 py-2" />
                    <input placeholder="State" value={form.preferences.studyLocation.state} onChange={e=>handleChange('preferences.studyLocation.state', e.target.value)} className="border rounded-lg px-3 py-2" />
                    <input placeholder="District" value={form.preferences.studyLocation.district} onChange={e=>handleChange('preferences.studyLocation.district', e.target.value)} className="border rounded-lg px-3 py-2" />
                  </div>
                </div>

                <button onClick={saveProfile} disabled={saving || isLoading} className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50">
                  <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Assessment History</h1>
                <p className="text-gray-600 mt-1">Your previous career assessments and recommendations</p>
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
                          <span className="text-sm text-gray-600">{formatDate(result.timestamp)}</span>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{result.group}</span>
                      </div>

                      {/* AI Recommendations */}
                      <div className="mb-6">
                        <h3 className="flex items-center text-lg font-semibold mb-4">
                          <Sparkles className="w-5 h-5 text-yellow-500 mr-2" /> AI Recommendations
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

                      {/* PDF Based Careers */}
                      {result.pdfCareers && result.pdfCareers.length > 0 && (
                        <div>
                          <h3 className="flex items-center text-lg font-semibold mb-4">
                            <BookOpen className="w-5 h-5 text-blue-500 mr-2" /> PDF-Based Matches
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
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default Profile;
