import React, { useState } from 'react';

const RegistrationForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'client',
        password: '',
        confirmPassword: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (formData.password !== formData.confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        const userToCreate = {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            password: formData.password
        };

        setIsSubmitting(true);

        try {
            const response = await fetch('http://localhost:8080/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userToCreate)
            });

            if (response.ok) {
                await response.json();
                setSuccessMessage('Registration successful. You can sign in now.');
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                let errorMessage = 'Registration failed!';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Ignore if not json
                }
                setErrorMessage(errorMessage);
            }
        } catch (error) {
            console.error('Error during registration:', error);
            setErrorMessage('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-md">
            <div className="rounded-[28px] border border-white/10 bg-white/95 p-8 shadow-[0_32px_80px_rgba(15,23,42,0.35)] backdrop-blur">
                <div className="mb-8">
                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        New Account
                    </span>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">Create account</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Set up access for an admin or client account in the platform.
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Full name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter full name"
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                            required
                        />
                    </div>
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
                        <label className="block text-sm font-medium text-slate-700">Account role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="app-select mt-2 w-full px-4 py-3 text-slate-900 outline-none transition"
                        >
                            <option value="client">Client</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Confirm password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter password"
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                            required
                        />
                    </div>
                    {errorMessage && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {errorMessage}
                        </div>
                    )}
                    {successMessage && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {successMessage}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                        {isSubmitting ? 'Creating account...' : 'Register'}
                    </button>
                </form>

                <div className="mt-8 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Existing user</span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>

                <p className="mt-5 text-sm text-slate-500">
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={onSuccess}
                        className="font-semibold text-slate-900 transition hover:text-emerald-700"
                    >
                        Return to login
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegistrationForm;
