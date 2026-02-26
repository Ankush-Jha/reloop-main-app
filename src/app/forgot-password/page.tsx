'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AuthService, EduEmailError } from '@/lib/firebase/auth';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await AuthService.sendPasswordResetEmail(email);
            setSuccess(true);
        } catch (err: any) {
            if (err instanceof EduEmailError) {
                setError(err.message);
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found with this email address.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                setError('Failed to send reset email. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#D0E8FF] dark:bg-dark-bg flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-6">
                        <div className="w-16 h-16 bg-primary rounded-2xl border-4 border-dark shadow-brutal flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-3xl text-dark" style={{ fontVariationSettings: "'FILL' 1" }}>recycling</span>
                        </div>
                    </Link>
                    <h1 className="text-3xl font-black uppercase text-dark dark:text-white tracking-tight">Reset Password</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Enter your email to receive a reset link
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-dark-surface rounded-2xl border-4 border-dark shadow-brutal p-6">
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-4"
                        >
                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
                            </div>
                            <h2 className="text-xl font-bold text-dark dark:text-white mb-2">Check Your Email!</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                                We've sent a password reset link to <strong>{email}</strong>
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-dark font-bold rounded-xl border-2 border-dark shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                                Back to Login
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your.email@edu.in"
                                    required
                                    className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg focus:border-primary outline-none transition-all text-dark dark:text-white font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !email}
                                className="w-full py-4 bg-primary text-dark font-black uppercase tracking-wide rounded-xl border-2 border-dark shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">mail</span>
                                        Send Reset Link
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Back to Login Link */}
                {!success && (
                    <div className="text-center mt-6">
                        <Link
                            href="/login"
                            className="text-dark dark:text-white font-bold hover:text-primary transition-colors inline-flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Back to Login
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
