import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function HomePage() {
    const navigate = useNavigate();
    const [selectedOption, setSelectedOption] = useState(null);
    const [showOptions, setShowOptions] = useState(false);

    const handleStartTest = () => {
        setShowOptions(true);
    };

    const handleOptionSelect = (optionIndex) => {
        setSelectedOption(optionIndex);
    };

    const handleTakeTest = () => {
        if (selectedOption !== null) {
            navigate(`/test?option=${selectedOption + 1}`); // Navigate with selected option index
        } else {
            alert("Please select an option before taking the test.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
                    Career Assessment Test
                </h1>
                <p className="text-gray-600 mb-8 text-lg">
                    Discover your ideal career path with our comprehensive assessment
                </p>

                {!showOptions ? (
                    <button
                        onClick={handleStartTest}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        Start Test
                    </button>
                ) : (
                    <div>
                        <p className="mb-4 text-lg text-gray-700">Choose an option to start your test:</p>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleOptionSelect(index)}
                                    className={`px-6 py-2 rounded-lg border ${selectedOption === index ? 'border-blue-500 bg-blue-100' : 'border-gray-300 hover:bg-gray-50'} transition-colors duration-200`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleTakeTest}
                            disabled={selectedOption === null}
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                        >
                            Take Test
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HomePage; 