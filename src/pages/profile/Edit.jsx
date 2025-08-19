import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Save, MapPin, Globe, Mail, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EditProfile() {
  const { user, refreshUser, isLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    groupType: '',
    preferences: {
      jobLocation: { country: '', state: '', district: '' },
      studyLocation: { country: '', state: '', district: '' }
    }
  });

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

  const handleChange = (path, value) => {
    setForm(prev => {
      const next = { ...prev };
      const segs = path.split('.');
      let cur = next;
      for (let i = 0; i < segs.length - 1; i++) {
        cur[segs[i]] = cur[segs[i]] ?? {};
        cur = cur[segs[i]];
      }
      cur[segs[segs.length - 1]] = value;
      return next;
    });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.updateUserProfile(form);
      await refreshUser();
      navigate('/profile/overview');
    } catch (e) {
      console.error('Failed to save profile:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Edit Profile</h1>
      <div className="space-y-4 max-w-2xl">
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
  );
}
