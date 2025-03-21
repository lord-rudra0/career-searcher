import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LoginForm from './LoginForm';
import { useAuth } from '../../context/AuthContext';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLoginSuccess = async (user) => {
        try {
            await login(user.username, user.password);
            navigate('/assessment');
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                            create a new account
                        </Link>
                    </p>
                </div>
                <LoginForm onSuccess={handleLoginSuccess} />
            </div>
        </div>
    );
}

export default Login; 