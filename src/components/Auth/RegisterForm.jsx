import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

function RegisterForm({ onSuccess }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [groupType, setGroupType] = useState('Class 11-12');
    const [jobCountry, setJobCountry] = useState('');
    const [jobState, setJobState] = useState('');
    const [jobDistrict, setJobDistrict] = useState('');
    const [studyCountry, setStudyCountry] = useState('');
    const [studyState, setStudyState] = useState('');
    const [studyDistrict, setStudyDistrict] = useState('');
    const [stream, setStream] = useState('');
    const [targetExam, setTargetExam] = useState('');
    const [colleges, setColleges] = useState(['', '', '']);
    const [error, setError] = useState('');
    const { signup } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const preferences = {
                jobLocation: {
                    country: jobCountry || undefined,
                    state: jobState || undefined,
                    district: jobDistrict || undefined
                },
                studyLocation: {
                    country: studyCountry || undefined,
                    state: studyState || undefined,
                    district: studyDistrict || undefined
                },
                stream: stream || undefined,
                targetExam: targetExam || undefined,
                colleges: colleges.map(c => c.trim()).filter(Boolean).slice(0,3)
            };
            await signup(username, email, password, groupType, preferences);
            onSuccess();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Username
                </label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Group Type
                </label>
                <select
                    value={groupType}
                    onChange={(e) => setGroupType(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                >
                    <option>Class 9-10</option>
                    <option>Class 11-12</option>
                    <option>UnderGraduate Student</option>
                    <option>PostGraduate</option>
                </select>
            </div>

            {/* Academic preferences */}
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Academic Preferences (optional)</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <input placeholder="Stream (e.g., Science, Commerce, Arts)" value={stream} onChange={(e) => setStream(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        <input placeholder="Target Exam (e.g., JEE, NEET, CUET)" value={targetExam} onChange={(e) => setTargetExam(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        <div className="grid grid-cols-1 gap-2">
                            {colleges.map((c, i) => (
                                <input key={i} placeholder={`Preferred College ${i+1}`} value={c} onChange={(e) => setColleges(prev => prev.map((v, idx) => idx===i ? e.target.value : v))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Job Location (optional)</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <input placeholder="Country" value={jobCountry} onChange={(e) => setJobCountry(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        <input placeholder="State" value={jobState} onChange={(e) => setJobState(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        <input placeholder="District" value={jobDistrict} onChange={(e) => setJobDistrict(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Study Location (optional)</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <input placeholder="Country" value={studyCountry} onChange={(e) => setStudyCountry(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        <input placeholder="State" value={studyState} onChange={(e) => setStudyState(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        <input placeholder="District" value={studyDistrict} onChange={(e) => setStudyDistrict(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                </div>
            </div>
            {error && (
                <div className="text-red-500 text-sm">{error}</div>
            )}
            <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
                Register
            </button>
        </form>
    );
}

export default RegisterForm; 