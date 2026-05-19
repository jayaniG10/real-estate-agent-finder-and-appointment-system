import React, { useState } from 'react';

const Loginform = ({ onRegisterClick, onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsSubmitting(true);

        try {
            const response = await fetch('http://localhost:8080/api/users');

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const users = await response.json();
            const matchedUser = users.find(
                (user) =>
                    user.email === formData.email &&
                    user.password === formData.password
            );

            if (!matchedUser) {
                setErrorMessage('Invalid email or password.');
                return;
            }

            if (onLoginSuccess) {
                onLoginSuccess(matchedUser);
            }
        } catch (error) {
            console.error('Error during login:', error);
            setErrorMessage('Unable to login right now. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-md">
            <div className="rounded-[28px] border border-white/10 bg-white/95 p-8 shadow-[0_32px_80px_rgba(15,23,42,0.35)] backdrop-blur">
                <div className="mb-8">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Secure Access
                    </span>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">Sign in</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Continue to your dashboard with your registered email and password.
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="name@company.com"
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                            required
                        />
                    </div>
                    {errorMessage && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {errorMessage}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-8 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">New here</span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>

                <p className="mt-5 text-sm text-slate-500">
                    Don't have an account?{' '}
                    <button
                        type="button"
                        onClick={onRegisterClick}
                        className="font-semibold text-slate-900 transition hover:text-blue-700"
                    >
                        Create one
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Loginform;
