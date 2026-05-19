import { useEffect, useState } from 'react';

const INITIAL_FORM_VALUES = {
    name: '',
    email: '',
    password: '',
    role: 'client'
};

const UserCreationForm = ({ user, isSubmitting, onCancel, onSubmit }) => {
    const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (user) {
            setFormValues({
                name: user.name ?? '',
                email: user.email ?? '',
                password: '',
                role: user.role ?? 'client'
            });
            return;
        }

        setFormValues(INITIAL_FORM_VALUES);
    }, [user]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((currentValues) => ({
            ...currentValues,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const normalizedValues = {
            name: formValues.name.trim(),
            email: formValues.email.trim(),
            password: formValues.password.trim(),
            role: formValues.role
        };

        if (!normalizedValues.name || !normalizedValues.email) {
            setErrorMessage('Name and email are required.');
            return;
        }

        if (!isEditing && !normalizedValues.password) {
            setErrorMessage('Password is required when creating a user.');
            return;
        }

        setErrorMessage('');
        await onSubmit(normalizedValues);
    };

    const isEditing = Boolean(user?.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/15">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-2xl font-semibold text-slate-900">
                        {isEditing ? 'Edit user' : 'Create user'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {isEditing
                            ? 'Update account details and role assignments.'
                            : 'Add a new platform user and assign the correct access role.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
                    {errorMessage ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errorMessage}
                        </div>
                    ) : null}

                    <div className="grid gap-5 md:grid-cols-2">
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Full name</span>
                            <input
                                type="text"
                                name="name"
                                value={formValues.name}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                placeholder="Enter full name"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Email address</span>
                            <input
                                type="email"
                                name="email"
                                value={formValues.email}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                placeholder="Enter email address"
                            />
                        </label>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">
                                {isEditing ? 'New password' : 'Password'}
                            </span>
                            <input
                                type="password"
                                name="password"
                                value={formValues.password}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                placeholder={isEditing ? 'Leave blank to keep current password' : 'Enter password'}
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Role</span>
                            <select
                                name="role"
                                value={formValues.role}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                            >
                                <option value="client">Client</option>
                                <option value="admin">Admin</option>
                            </select>
                        </label>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                        >
                            {isSubmitting
                                ? isEditing
                                    ? 'Saving changes...'
                                    : 'Creating user...'
                                : isEditing
                                  ? 'Save changes'
                                  : 'Create user'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserCreationForm;
