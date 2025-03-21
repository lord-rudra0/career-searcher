import React from 'react';
import { ChevronRight, GraduationCap, Milestone, Award } from 'lucide-react';

const CareerRoadmap = ({ career }) => {
    // Add default values and validation
    if (!career) {
        return null;
    }

    const roadmapSteps = career.roadmap || [
        "Entry Level: Basic skills and education",
        "Mid Level: Professional experience",
        "Senior Level: Advanced expertise"
    ];

    const recommendedColleges = career.colleges || [
        {
            name: "General University",
            program: "Related Degree Program",
            duration: "4 years",
            location: "Various Locations"
        }
    ];

    return (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-md animate-fade-in">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Milestone className="w-5 h-5 mr-2 text-blue-500" />
                Career Path: {career.title || 'Career'}
            </h3>
            
            {/* Roadmap Steps */}
            <div className="space-y-4">
                {roadmapSteps.map((step, index) => (
                    <div 
                        key={index}
                        className="flex items-start p-3 bg-gray-50 rounded-md transform hover:scale-102 transition-transform duration-200 animate-slide-up"
                        style={{ animationDelay: `${index * 150}ms` }}
                    >
                        <ChevronRight className="w-5 h-5 mt-1 text-blue-500" />
                        <div className="ml-2">{step}</div>
                    </div>
                ))}
            </div>

            {/* Recommended Colleges */}
            <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-blue-500" />
                    Recommended Educational Paths
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendedColleges.map((college, index) => (
                        <div 
                            key={index}
                            className="p-3 bg-blue-50 rounded-md transform hover:scale-102 transition-transform duration-200 animate-fade-in"
                            style={{ animationDelay: `${(index + roadmapSteps.length) * 150}ms` }}
                        >
                            <h5 className="font-semibold text-blue-700">{college.name}</h5>
                            <p className="text-sm text-gray-600">{college.program}</p>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                                <Award className="w-4 h-4 mr-1" />
                                <span>{college.duration}</span>
                                <span className="mx-2">•</span>
                                <span>{college.location}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CareerRoadmap; 