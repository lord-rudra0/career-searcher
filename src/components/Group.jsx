import React, { useState } from "react";
import { Book, GraduationCap, School, Trophy } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";

function Group() {
  const [selectedCategory, setSelectedCategory] = useState(null);

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
    // Redirect to /test with the selected category as a query parameter
    window.location.href = `/test?category=${selectedCategory}`;
  };

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