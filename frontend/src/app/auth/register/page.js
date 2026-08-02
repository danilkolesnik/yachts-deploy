"use client"
import React, { useState } from 'react';
import { URL } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { BRAND } from '@/constants/brand';
import AuthShell from '@/component/AuthShell';

const inputClass = (hasError) =>
  `w-full px-3 py-2.5 border ${hasError ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(8,50,104,0.25)] text-black bg-white`;

const Register = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async(e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        await axios.post(`${URL}/auth/register`, { email, password, fullName })
            .then((res) => {
                if (res.data.code === 409) {
                    setErrorMessage('This user already exists.');
                } else {
                    router.push('/auth/login');
                }
            })
            .catch(() => {
                setErrorMessage('Network error. Please try again later.');
            });

    };

    return (
        <AuthShell
            title="Create account"
            subtitle="Register to access All Services Marine"
            footer={
                <p style={{ color: BRAND.colors.ink }}>
                    Already have an account?{' '}
                    <Link
                        href="/auth/login"
                        className="font-medium underline-offset-2 hover:underline"
                        style={{ color: BRAND.colors.blue }}
                    >
                        Login
                    </Link>
                </p>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: BRAND.colors.ink }}>
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (errorMessage) setErrorMessage('');
                        }}
                        required
                        className={inputClass(Boolean(errorMessage))}
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: BRAND.colors.ink }}>
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (errorMessage) setErrorMessage('');
                        }}
                        required
                        className={inputClass(Boolean(errorMessage))}
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: BRAND.colors.ink }}>
                        Confirm password
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (errorMessage) setErrorMessage('');
                        }}
                        required
                        className={inputClass(Boolean(errorMessage))}
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: BRAND.colors.ink }}>
                        Customer name
                    </label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                            setFullName(e.target.value);
                            if (errorMessage) setErrorMessage('');
                        }}
                        required
                        className={inputClass(Boolean(errorMessage))}
                    />
                </div>
                {errorMessage && (
                    <div className="text-sm text-red-600">{errorMessage}</div>
                )}
                <button
                    type="submit"
                    className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: BRAND.colors.navy }}
                >
                    Register
                </button>
            </form>
        </AuthShell>
    );
};

export default Register;
