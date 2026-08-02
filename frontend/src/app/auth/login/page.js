"use client"
import React, { useState } from 'react';
import { URL } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { useAppDispatch } from '@/lib/hooks';
import { setUserFromVerify, clearUserSession } from '@/lib/features/todos/usersDataSlice';
import { PermissionsList } from '@/constants/permissions';
import { can } from '@/utils/canPermission';
import { BRAND } from '@/constants/brand';
import AuthShell from '@/component/AuthShell';

const inputClass = (hasError) =>
  `w-full px-3 py-2.5 border ${hasError ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(8,50,104,0.25)] text-black bg-white`;

const Login = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const getLandingRoute = (role, permissions) => {
        if (role === 'client') return '/client/orders';
        if (can(permissions, PermissionsList.OFFERS_READ)) return '/offers';
        if (can(permissions, PermissionsList.ORDERS_READ)) return '/orders';
        if (can(permissions, PermissionsList.USERS_READ)) return '/yachts';
        return '/login';
    };

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
                    const me = verifyResponse.data.data;
                    localStorage.setItem('role', me.role);
                    dispatch(
                        setUserFromVerify({
                            email: me.email,
                            role: me.role,
                            id: me.id,
                            permissions: me.permissions,
                            responsibilityAreas: me.responsibilityAreas,
                        }),
                    );
                    router.push(getLandingRoute(me.role, me.permissions || []));
                    return;
                }
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                dispatch(clearUserSession());
                setErrorMessage('Could not verify session. Please try again.');
                return;
            } else {
                setErrorMessage('Incorrect email or password.');
            }
        } catch (error) {
            setErrorMessage('Network error. Please try again later.');
        }
    };

    return (
        <AuthShell
            title="Sign in"
            subtitle="Access your yacht service workspace"
            footer={
                <div className="space-y-2" style={{ color: BRAND.colors.ink }}>
                    <p>
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/auth/register"
                            className="font-medium underline-offset-2 hover:underline"
                            style={{ color: BRAND.colors.blue }}
                        >
                            Register
                        </Link>
                    </p>
                    <p>
                        <Link
                            href="/auth/send-email"
                            className="font-medium underline-offset-2 hover:underline"
                            style={{ color: BRAND.colors.blue }}
                        >
                            Forgot password?
                        </Link>
                    </p>
                </div>
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
                {errorMessage && (
                    <div className="text-sm text-red-600">{errorMessage}</div>
                )}
                <button
                    type="submit"
                    className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: BRAND.colors.navy }}
                >
                    Login
                </button>
            </form>
        </AuthShell>
    );
};

export default Login;
