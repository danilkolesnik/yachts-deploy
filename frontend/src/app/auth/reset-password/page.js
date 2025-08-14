"use client";
import React, { useState, Suspense } from 'react';
import { URL } from '@/utils/constants';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from 'axios';
import Link from 'next/link';

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${URL}/auth/reset-password`, { userId, newPassword });
      if (response.data.code === 200) {
        toast.success('Password reset successfully');
        router.push('/auth/login');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Network error. Please try again later.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-black">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-black">New Password:</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              required
              className={`w-full px-3 py-2 border ${errorMessage ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring focus:ring-blue-200 text-black`}
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200"
          >
            Reset Password
          </button>
          <p className="text-center text-sm text-black">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
