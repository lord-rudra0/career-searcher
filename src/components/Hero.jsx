import React from 'react';
import { Link } from 'react-router-dom';
import { LogoAnimation } from './LogoAnimation'; // If you have this component

function Hero() {
    return (
        <div className="relative min-h-screen">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm shadow-lg py-4 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <LogoAnimation />
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Career Compass
                        </h1>
                    </div>
                    <div className="flex space-x-4">
                        <Link
                            to="/login"
                            className="px-4 py-2 text-indigo-600 hover:text-indigo-700"
                        >
                            Log In
                        </Link>
                        <Link
                            to="/register"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <h2 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                        <span className="block">Discover Your</span>
                        <span className="block text-indigo-600">Perfect Career Path</span>
                    </h2>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        Take our AI-powered career assessment to find the perfect career match for your skills, interests, and personality.
                    </p>
                    <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                        <div className="rounded-md shadow">
                            <Link
                                to="/register"
                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                            >
                                Start Free Assessment
                            </Link>
                        </div>
                        <div className="mt-3 sm:mt-0 sm:ml-3">
                            <Link
                                to="/login"
                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900">AI-Powered Analysis</h3>
                        <p className="mt-2 text-gray-600">Advanced AI algorithms analyze your responses to provide personalized career recommendations.</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900">Comprehensive Assessment</h3>
                        <p className="mt-2 text-gray-600">In-depth questions designed to understand your skills, interests, and career goals.</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900">Detailed Insights</h3>
                        <p className="mt-2 text-gray-600">Get detailed career matches with explanations and potential growth paths.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Hero; 