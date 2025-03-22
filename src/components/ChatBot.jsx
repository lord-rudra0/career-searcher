import React, { useState } from 'react';
import axios from 'axios';

const ChatBot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
        <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md">
            <div className="h-96 overflow-y-auto mb-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`mb-3 p-3 rounded-lg ${
                        msg.role === 'user' ? 'bg-blue-100 ml-auto w-3/4' : 'bg-gray-100 mr-auto w-3/4'
                    }`}>
                        <p className="text-sm">{msg.content}</p>
                        <span className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading}
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message..."
                />
                <button 
                    onClick={handleSend} 
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default ChatBot; 