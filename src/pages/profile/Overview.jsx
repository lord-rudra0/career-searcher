import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, User as UserIcon, MapPin, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Overview() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Account Overview</h1>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="flex items-center text-gray-700"><UserIcon className="w-4 h-4 mr-2"/>Name</div>
            <div className="mt-1 text-lg font-semibold">{user?.username || user?.name || '-'}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="flex items-center text-gray-700"><Mail className="w-4 h-4 mr-2"/>Email</div>
            <div className="mt-1 text-lg font-semibold">{user?.email || '-'}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="text-gray-700">Group Type</div>
            <div className="mt-1 text-lg font-semibold">{user?.groupType || '-'}</div>
          </div>
        </div>

        {/* Academic Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="text-gray-700">Stream</div>
            <div className="mt-1 text-lg font-semibold">{user?.preferences?.stream || '-'}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="text-gray-700">Target Exam</div>
            <div className="mt-1 text-lg font-semibold">{user?.preferences?.targetExam || '-'}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 md:col-span-2">
            <div className="text-gray-700">Preferred Colleges</div>
            <div className="mt-2 text-sm">
              {(user?.preferences?.colleges && user.preferences.colleges.length > 0) ? (
                <div className="flex flex-wrap gap-2">
                  {user.preferences.colleges.slice(0,3).map((c, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white border rounded-md">{c}</span>
                  ))}
                </div>
              ) : (
                <span className="font-medium">-</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="flex items-center text-gray-700"><MapPin className="w-4 h-4 mr-2"/>Job Location</div>
            <div className="mt-2 text-sm">
              <div>Country: <span className="font-medium">{user?.preferences?.jobLocation?.country || '-'}</span></div>
              <div>State: <span className="font-medium">{user?.preferences?.jobLocation?.state || '-'}</span></div>
              <div>District: <span className="font-medium">{user?.preferences?.jobLocation?.district || '-'}</span></div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="flex items-center text-gray-700"><Globe className="w-4 h-4 mr-2"/>Study Location</div>
            <div className="mt-2 text-sm">
              <div>Country: <span className="font-medium">{user?.preferences?.studyLocation?.country || '-'}</span></div>
              <div>State: <span className="font-medium">{user?.preferences?.studyLocation?.state || '-'}</span></div>
              <div>District: <span className="font-medium">{user?.preferences?.studyLocation?.district || '-'}</span></div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link to="/profile/edit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Edit Profile</Link>
          <Link to="/profile/history" className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800">View History</Link>
        </div>
      </div>
    </div>
  );
}
