'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthService, EduEmailError } from '@/lib/firebase/auth';
import { isAllowedEduEmail, getAllowedDomainsMessage } from '@/lib/utils/auth-helpers';

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hostel, setHostel] = useState('');
    const [room, setRoom] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Name is required');
            return;
        }
        if (!isAllowedEduEmail(email)) {
            setError(`Only institutional emails allowed (${getAllowedDomainsMessage()})`);
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await AuthService.registerWithEmail(email, password, name, hostel || undefined, room || undefined);
            router.push('/');
        } catch (err: any) {
            console.error(err);
            if (err instanceof EduEmailError) {
                setError(err.message);
            } else if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak');
            } else {
                setError('Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        setGoogleLoading(true);

        try {
            await AuthService.signInWithGoogle();
            router.push('/');
        } catch (err: any) {
            console.error(err);
            if (err instanceof EduEmailError) {
                setError('Please use your college email (@nst.rishihood.edu.in) to sign up');
            } else if (err.code === 'auth/popup-closed-by-user') {
                // User closed popup, no error
            } else {
                setError('Google sign up failed');
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-200 to-white dark:from-dark-bg dark:to-dark-surface flex flex-col items-center justify-center p-4">
            {/* Logo */}
            <div className="mb-6 text-center">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter text-dark dark:text-white">ReLoop</h1>
                <p className="text-sm font-bold text-dark/60 dark:text-white/60 uppercase tracking-widest mt-1">♻️ Trade Sustainably</p>
            </div>

            <div className="w-full max-w-md bg-white dark:bg-dark-surface rounded-2xl shadow-brutal p-8 border-2 border-dark dark:border-gray-700">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-dark dark:text-white uppercase">Join ReLoop</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Start your sustainable trading journey</p>
                </div>

                {/* Edu Email Notice */}
                <div className="bg-card-mint/50 border-2 border-primary/30 rounded-xl p-3 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🎓</span>
                        <div>
                            <p className="text-sm font-bold text-dark dark:text-white">
                                Only for <span className="text-primary">Rishihood University</span> students
                            </p>
                            <p className="text-xs text-gray-500">Use your @nst.rishihood.edu.in email</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-card-coral text-dark p-3 rounded-xl mb-4 text-sm font-bold border-2 border-dark flex items-center gap-2">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                {/* Google Sign Up - Primary */}
                <button
                    onClick={handleGoogleSignup}
                    disabled={googleLoading || loading}
                    className="w-full py-4 bg-white dark:bg-dark-bg neo-border rounded-xl font-bold text-dark dark:text-white shadow-brutal active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-3 mb-4 disabled:opacity-50"
                >
                    {googleLoading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            Signing up...
                        </span>
                    ) : (
                        <>
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                            Sign up with Google
                        </>
                    )}
                </button>

                <div className="my-6 flex items-center gap-4">
                    <div className="h-0.5 flex-1 bg-gray-100 dark:bg-gray-800" />
                    <span className="text-xs text-gray-400 font-black uppercase">Or with Email</span>
                    <div className="h-0.5 flex-1 bg-gray-100 dark:bg-gray-800" />
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black text-dark dark:text-white uppercase tracking-wider mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setError(''); }}
                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-primary outline-none transition-colors font-bold"
                            placeholder="Your full name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-dark dark:text-white uppercase tracking-wider mb-2">
                            Institutional Email *
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-primary outline-none transition-colors font-bold"
                            placeholder="yourname@nst.rishihood.edu.in"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-dark dark:text-white uppercase tracking-wider mb-2">
                            Password *
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-primary outline-none transition-colors font-bold"
                            placeholder="••••••••"
                            minLength={6}
                            required
                        />
                        <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-dark dark:text-white uppercase tracking-wider mb-2">
                                Hostel
                            </label>
                            <select
                                value={hostel}
                                onChange={(e) => setHostel(e.target.value)}
                                className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-primary outline-none transition-colors font-bold"
                            >
                                <option value="">Select</option>
                                <option value="Boys Hostel A">Boys Hostel A</option>
                                <option value="Boys Hostel B">Boys Hostel B</option>
                                <option value="Girls Hostel A">Girls Hostel A</option>
                                <option value="Girls Hostel B">Girls Hostel B</option>
                                <option value="Day Scholar">Day Scholar</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-dark dark:text-white uppercase tracking-wider mb-2">
                                Room No.
                            </label>
                            <input
                                type="text"
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-primary outline-none transition-colors font-bold"
                                placeholder="e.g. 101"
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
                                Creating Account...
                            </span>
                        ) : (
                            'Create Account with Email'
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href="/login" className="font-black text-primary hover:underline">
                        Log In
                    </Link>
                </p>

                {/* Bonus indicator */}
                <div className="mt-6 pt-4 border-t-2 border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="text-2xl">🪙</span>
                        <span className="font-bold text-dark dark:text-white">Get 100 coins on signup!</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
