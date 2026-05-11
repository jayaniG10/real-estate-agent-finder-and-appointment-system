import React from 'react';

const clientTabs = [
    { label: 'Properties', path: '/client/properties' },
    { label: 'Appointments', path: '/client/appointments' },
    { label: 'Inquiries', path: '/client/inquiries' },
    { label: 'Comparisons', path: '/client/comparisons' },
    { label: 'Favorites', path: '/client/favorites' }
];

const adminTabs = [
    { label: 'Users', path: '/admin/users' },
    { label: 'Properties', path: '/admin/properties' },
    { label: 'Appointments', path: '/admin/appointments' },
    { label: 'Inquiries', path: '/admin/inquiries' },
    { label: 'Ratings', path: '/admin/ratings' }
];

const SideBar = ({ role, currentPath, onNavigate, onLogout }) => {
    const tabs = role === 'admin' ? adminTabs : clientTabs;

    return (
        <aside className="fixed inset-y-0 left-0 z-40 flex h-screen w-72 flex-col overflow-y-auto border-r border-slate-200 bg-[linear-gradient(180deg,_#0f172a_0%,_#111827_100%)] px-5 py-6 text-white shadow-[18px_0_40px_rgba(15,23,42,0.08)]">
            <div className="mb-8 rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                    Property Management
                </span>
                <h2 className="mt-3 text-2xl font-semibold capitalize">{role} Panel</h2>
            </div>

            <nav className="flex flex-1 flex-col gap-2">
                {tabs.map((tab) => {
                    const isActive =
                        currentPath === tab.path || currentPath.startsWith(`${tab.path}/`);

                    return (
                        <button
                            key={tab.path}
                            type="button"
                            onClick={() => onNavigate(tab.path)}
                            className={`group rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                                isActive
                                    ? 'border-white/30 bg-white text-slate-950 shadow-lg'
                                    : 'border-transparent bg-white/5 text-slate-200 hover:border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span className="flex items-center justify-between gap-3">
                                {tab.label}
                                <span
                                    className={`h-2.5 w-2.5 rounded-full ${
                                        isActive ? 'bg-emerald-500' : 'bg-slate-500 group-hover:bg-slate-300'
                                    }`}
                                />
                            </span>
                        </button>
                    );
                })}
            </nav>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/6 p-4">
                <button
                    type="button"
                    onClick={onLogout}
                    className="mt-4 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-slate-950"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default SideBar;
