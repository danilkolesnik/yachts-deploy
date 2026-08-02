"use client"
import React, { useState } from 'react';
import { URL } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from 'axios';
import Link from 'next/link';
import { BRAND } from '@/constants/brand';
import AuthShell from '@/component/AuthShell';

const SendEmail = () => {
    const [email, setEmail] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${URL}/auth/send-email`, { email });
            if (response.data.code === 200) {
                toast.success('Email sent successfully');
                router.push('/auth/login');
            } else {
                toast.error(response.data.message);
            }
        } catch {
            toast.error('Network error. Please try again later.');
        }
    };

    return (
        <AuthShell
            title="Reset password"
            subtitle="We will send a reset link to your email"
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
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-black focus:outline-none focus:ring-2 focus:ring-[rgba(8,50,104,0.25)]"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: BRAND.colors.navy }}
                >
                    Send email
                </button>
            </form>
        </AuthShell>
    );
};

export default SendEmail;
