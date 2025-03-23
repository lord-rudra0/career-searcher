import React, { useState } from 'react';
import axios from 'axios';
import { MessageSquare, X } from 'lucide-react';

const ChatBot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        setIsLoading(true);
        const userMessage = { role: 'user', content: input, timestamp: new Date() };
        
        try {
            const response = await axios.post('http://localhost:5002/chat', {
                message: input,
                chatHistory: messages
            });
            
            const botMessage = {
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date()
            };
            
            setMessages([...messages, userMessage, botMessage]);
            setInput('');
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 ${
                    isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                }`}
            >
                <MessageSquare className="w-6 h-6" />
            </button>

            {/* Chat Window */}
            <div
                className={`transform transition-all duration-300 ease-in-out fixed bottom-20 right-4 ${
                    isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`}
                style={{ width: '350px' }}
            >
                <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col h-[500px]">
                    {/* Chat Header */}
                    <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
                        <h3 className="text-white font-semibold">Career Guidance Chat</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-white hover:text-indigo-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${
                                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-100 text-indigo-900'
                                            : 'bg-gray-100 text-gray-900'
                                    } animate-slide-up`}
                                    style={{ animationDelay: `${i * 50}ms` }}
                                >
                                    <p className="text-sm">{msg.content}</p>
                                    <span className="text-xs text-gray-500 block mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    <div className="border-t p-3 bg-gray-50">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isLoading}
                                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                placeholder="Type your message..."
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Sending...
                                    </div>
                                ) : (
                                    'Send'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatBot; 