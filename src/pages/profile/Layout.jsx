import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { User as UserIcon, Edit3, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LinkItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-4 py-2 rounded-lg transition-colors ${
        isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
      }`
    }
  >
    <Icon className="w-4 h-4 mr-2" />
    {label}
  </NavLink>
);

export default function ProfileLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="bg-white rounded-2xl shadow-xl p-6 h-fit">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>
            <nav className="space-y-2">
              <LinkItem to="/profile/overview" icon={UserIcon} label="Overview" />
              <LinkItem to="/profile/edit" icon={Edit3} label="Edit Profile" />
              <LinkItem to="/profile/history" icon={Clock} label="Assessment History" />
            </nav>
          </aside>
          <section className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <Outlet />
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
