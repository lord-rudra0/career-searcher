import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RegisterForm from './RegisterForm';
import { useAuth } from '../../context/AuthContext';

function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleRegisterSuccess = async (user) => {
        try {
            await register(user.username, user.email, user.password);
            navigate('/assessment');
        } catch (error) {
            console.error('Registration error:', error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            sign in to existing account
                        </Link>
                    </p>
                </div>
                <RegisterForm onSuccess={handleRegisterSuccess} />
            </div>
        </div>
    );
}

export default Register; 