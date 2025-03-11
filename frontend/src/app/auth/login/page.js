"use client"
import React, { useState } from 'react';
import { URL } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

const Login = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${URL}/auth/login`, { email, password });
            if (response.data.code === 200) {
                localStorage.setItem('token', response.data.token);
                
                const verifyResponse = await axios.post(`${URL}/auth/verify`, {}, {
                    headers: {
                        Authorization: `Bearer ${response.data.token}`,
                    },
                });
                if (verifyResponse.data.code === 200) {
                    localStorage.setItem('role', verifyResponse.data.data.role);
                }
                router.push('/offers');
            } else {
                setErrorMessage('Incorrect email or password.');
            }
        } catch (error) {
            setErrorMessage('Network error. Please try again later.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
                <h2 className="text-2xl font-bold text-center text-black">Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="block text-sm font-medium text-black">Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errorMessage) setErrorMessage('');
                            }}
                            required
                            className={`w-full px-3 py-2 border ${errorMessage ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring focus:ring-blue-200 text-black`}
                        />
                    </div>
                    <div className="form-group">
                        <label className="block text-sm font-medium text-black">Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errorMessage) setErrorMessage('');
                            }}
                            required
                            className={`w-full px-3 py-2 border ${errorMessage ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring focus:ring-blue-200 text-black`}
                        />
                    </div>
                    {errorMessage && (
                        <div className="text-red-500 text-sm mt-1">
                            {errorMessage}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200"
                    >
                        Login
                    </button>
                </form>
                <p className="text-center text-sm text-black">
                    Don&apos;t have an account? 
                    <Link href="/auth/register" className="text-blue-500 hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;