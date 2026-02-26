'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { AuthService, EduEmailError } from '@/lib/firebase/auth';
import { isAllowedEduEmail, getAllowedDomainsMessage } from '@/lib/utils/auth-helpers';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { enableDemoMode } = useAuth();
    const redirectUrl = searchParams ? searchParams.get('redirect') || '/' : '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate edu email
        if (!isAllowedEduEmail(email)) {
            setError(`Only institutional emails allowed (${getAllowedDomainsMessage()})`);
            return;
        }

        setLoading(true);

        try {
            await AuthService.signInWithEmail(email, password);
            router.push(redirectUrl);
        } catch (err: any) {
            console.error(err);
            if (err instanceof EduEmailError) {
                setError(err.message);
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found with this email');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Incorrect password');
            } else {
                setError('Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setGoogleLoading(true);

        try {
            await AuthService.signInWithGoogle();
            router.push(redirectUrl);
        } catch (err: any) {
            console.error(err);
            if (err instanceof EduEmailError) {
                setError('Please use your college email (@nst.rishihood.edu.in) to sign in');
            } else if (err.code === 'auth/popup-closed-by-user') {
                // User closed popup, no error needed
            } else {
                setError(`Google sign in failed: ${err.code || err.message}`);
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-200 to-white dark:from-dark-bg dark:to-dark-surface flex flex-col items-center justify-center p-4">
            {/* Logo */}
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter text-dark dark:text-white">ReLoop</h1>
                <p className="text-sm font-bold text-dark/60 dark:text-white/60 uppercase tracking-widest mt-1">♻️ Trade Sustainably</p>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md bg-white dark:bg-dark-surface rounded-2xl neo-border shadow-brutal p-8">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-dark dark:text-white uppercase tracking-tight">Welcome Back!</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Log in with your institutional email</p>
                </div>

                {/* Edu Email Notice */}
                <div className="bg-card-mint/50 border-2 border-primary/30 rounded-xl p-3 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🎓</span>
                        <p className="text-sm font-bold text-dark dark:text-white">
                            Use your <span className="text-primary">@nst.rishihood.edu.in</span> email
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-card-coral text-dark p-3 rounded-xl mb-4 text-sm font-bold neo-border flex items-center gap-2">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                {/* Google Sign In - Primary */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                    className="w-full py-4 bg-white dark:bg-dark-bg neo-border rounded-xl font-bold text-dark dark:text-white shadow-brutal active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-3 mb-4 disabled:opacity-50"
                >
                    {googleLoading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            Signing in...
                        </span>
                    ) : (
                        <>
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                            Continue with Google
                        </>
                    )}
                </button>

                <div className="my-6 flex items-center gap-4">
                    <div className="h-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />
                    <span className="text-xs text-gray-400 font-black uppercase">Or with Email</span>
                    <div className="h-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black text-dark dark:text-white uppercase tracking-wider mb-2">
                            Institutional Email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-0 bg-dark rounded-xl translate-x-1 translate-y-1" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                }}
                                className="relative w-full p-4 rounded-xl neo-border bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary outline-none transition-all text-dark dark:text-white font-bold"
                                placeholder="yourname@nst.rishihood.edu.in"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-black text-dark dark:text-white uppercase tracking-wider">Password</label>
                            <Link
                                href="/forgot-password"
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-dark rounded-xl translate-x-1 translate-y-1" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="relative w-full p-4 rounded-xl neo-border bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary outline-none transition-all text-dark dark:text-white font-bold"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || googleLoading}
                        className="w-full py-4 bg-primary text-dark font-black uppercase tracking-wider rounded-xl neo-border shadow-brutal active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 transition-all"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                                Logging in...
                            </span>
                        ) : (
                            'Log In with Email'
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <Link href="/register" className="font-black text-primary hover:underline">
                        Sign Up
                    </Link>
                </p>

                <div className="mt-6 pt-6 border-t-2 border-gray-100 dark:border-gray-800 text-center">
                    <button
                        onClick={() => {
                            enableDemoMode();
                            router.push('/');
                        }}
                        className="px-6 py-3 bg-card-yellow neo-border rounded-full font-black text-dark text-sm shadow-brutal-sm active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
                    >
                        Try Demo Mode 🚀
                    </button>
                </div>
            </div>
        </div>
    );
}

function LoginLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-200 to-white dark:from-dark-bg dark:to-dark-surface flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginLoading />}>
            <LoginContent />
        </Suspense>
    );
}
