import React, { useEffect, useState } from "react";
import { Book, GraduationCap, School, Trophy } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Group() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Map stored groupType to option id used by Ques_res and questions.json
  const groupTypeToOption = (groupType) => {
    if (!groupType || typeof groupType !== 'string') return null;
    const g = groupType.trim().toLowerCase();
    if (g.includes('9-10') || g.includes('9') && g.includes('10')) return 1;
    if (g.includes('11-12') || (g.includes('11') && g.includes('12'))) return 2;
    if (
      g.includes('undergraduate') ||
      g.includes('under graduate') ||
      g === 'ug' ||
      g.includes('college')
    ) return 3;
    if (
      g.includes('postgraduate') ||
      g.includes('post graduate') ||
      g === 'pg'
    ) return 4;
    // exact known labels
    switch (groupType) {
      case 'Class 9-10':
        return 1;
      case 'Class 11-12':
        return 2;
      case 'UnderGraduate Student':
      case 'Undergraduate Student':
      case 'College Student':
        return 3;
      case 'PostGraduate':
      case 'Post Graduate':
      case 'PG':
        return 4;
      default:
        return null;
    }
  };

  // If user is logged in and has a saved groupType, skip selection and go directly
  useEffect(() => {
    if (isLoading) return;
    if (user) {
      const gt = user.groupType;
      const option = groupTypeToOption(gt) || 1; // fallback to default if unrecognized
      navigate(`/test/questions?option=${option}`);
    }
  }, [user, isLoading, navigate]);

  const categories = [
    {
      id: 1,
      name: "Class 9-10",
      icon: <School className="w-8 h-8 text-blue-500" />,
      description: "Secondary School Students"
    },
    {
      id: 2, 
      name: "Class 11-12",
      icon: <Book className="w-8 h-8 text-green-500" />,
      description: "Higher Secondary Students"
    },
    {
      id: 3,
      name: "College Student",
      icon: <GraduationCap className="w-8 h-8 text-purple-500" />,
      description: "Undergraduate Students"
    },
    {
      id: 4,
      name: "PG",
      icon: <Trophy className="w-8 h-8 text-orange-500" />,
      description: "Post Graduate Students"
    }
  ];

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleContinue = () => {
    navigate(`/test/questions?option=${selectedCategory}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 pt-28 pb-20">
          <div className="max-w-4xl mx-auto text-center text-gray-600">Checking your preferences...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 pt-28 pb-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Select Your Educational Category
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`p-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                    : "bg-white hover:shadow-xl text-gray-800"
                }`}
              >
                <div className="mb-4">{category.icon}</div>
                <h2 className="text-xl font-semibold mb-2">{category.name}</h2>
                <p className={`text-sm ${
                  selectedCategory === category.id ? "text-blue-100" : "text-gray-600"
                }`}>
                  {category.description}
                </p>
              </button>
            ))}
          </div>

          {selectedCategory && (
            <div className="mt-8 text-center">
              <button 
                onClick={handleContinue}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-102"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Group;