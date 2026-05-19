import React, { useState } from 'react';
import Loginform from './components/Loginform';
import RegistrationForm from './components/RegistrationForm';

const LoginPage = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);

    const toggleForm = () => {
        setIsLogin(!isLogin);
    };

    const handleRegistrationSuccess = () => {
        setIsLogin(true); // Switch to login form after successful registration
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,_#020617,_#0f172a_55%,_#111827)]" />
            <div className="absolute inset-y-0 left-0 hidden w-1/2 border-r border-white/10 bg-white/5 lg:block" />

            <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <section className="hidden lg:block">
                        <div className="max-w-xl">
                            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                Property Management Suite
                            </span>
                            <h1 className="mt-6 text-5xl font-semibold leading-tight text-white">
                                Professional tools for managing clients, properties, and operations.
                            </h1>
                            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
                                Access a focused workspace built for agents, administrators, and clients to keep listings,
                                appointments, and inquiries organized.
                            </p>
                            <div className="mt-8 grid max-w-lg gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                                    <p className="text-sm font-medium text-white">Centralized access</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-300">
                                        One secure entry point for operational and client workflows.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                                    <p className="text-sm font-medium text-white">Role-based experience</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-300">
                                        Each user lands directly in the tools relevant to their responsibilities.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div>
                        {isLogin ? (
                            <Loginform onRegisterClick={toggleForm} onLoginSuccess={onLoginSuccess} />
                        ) : (
                            <RegistrationForm onSuccess={handleRegistrationSuccess} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
