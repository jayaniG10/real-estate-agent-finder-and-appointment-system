import { useEffect, useState } from 'react';
import UserCreationForm from './components/UserCreationForm';

const API_BASE_URL = 'http://localhost:8080/api/users';

const formatDateTime = (value) => {
    if (!value) {
        return 'Not available';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return value;
    }

    return parsedDate.toLocaleString();
};

const getErrorMessage = (error, fallbackMessage) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
};

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState(null);

    const loadUsers = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await fetch(API_BASE_URL);

            if (!response.ok) {
                throw new Error('Unable to load users.');
            }

            const data = await response.json();
            setUsers(data);
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to load users.'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleCreateClick = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        if (isSubmitting) {
            return;
        }

        setIsFormOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (formValues) => {
        setIsSubmitting(true);
        setErrorMessage('');

        const isEditing = Boolean(editingUser?.id);
        const endpoint = isEditing ? `${API_BASE_URL}/${editingUser.id}` : API_BASE_URL;
        const method = isEditing ? 'PUT' : 'POST';
        const payload = {
            ...formValues,
            ...(isEditing ? { id: editingUser.id, createdAt: editingUser.createdAt ?? null } : {})
        };

        try {
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(isEditing ? 'Unable to update user.' : 'Unable to create user.');
            }

            await loadUsers();
            setIsFormOpen(false);
            setEditingUser(null);
        } catch (error) {
            setErrorMessage(
                getErrorMessage(
                    error,
                    isEditing ? 'Unable to update user.' : 'Unable to create user.'
                )
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (user) => {
        const confirmed = window.confirm(`Delete ${user.name}?`);
        if (!confirmed) {
            return;
        }

        setDeletingUserId(user.id);
        setErrorMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/${user.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Unable to delete user.');
            }

            setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id));
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to delete user.'));
        } finally {
            setDeletingUserId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-300/40">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.32),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.22),_transparent_32%)] p-8 md:p-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                    Admin Console
                                </span>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                    User management
                                </h1>
                            </div>
                            <button
                                type="button"
                                onClick={handleCreateClick}
                                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                            >
                                Add user
                            </button>
                        </div>
                    </div>
                </section>

                {errorMessage ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Total users</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{users.length}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Admins</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">
                            {users.filter((user) => user.role === 'admin').length}
                        </p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Clients</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">
                            {users.filter((user) => user.role === 'client').length}
                        </p>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">All users</h2>
                            <p className="mt-1 text-sm text-slate-500">Manage account details and roles.</p>
                        </div>
                        <button
                            type="button"
                            onClick={loadUsers}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                            Refresh
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="px-6 py-16 text-center text-sm text-slate-500">Loading users...</div>
                    ) : users.length === 0 ? (
                        <div className="px-6 py-16 text-center text-sm text-slate-500">
                            No users found. Create the first account to get started.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Role
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Created
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map((user) => (
                                        <tr key={user.id} className="transition hover:bg-slate-50/80">
                                            <td className="px-6 py-5">
                                                <div className="font-medium text-slate-900">{user.name}</div>
                                                <div className="mt-1 text-sm text-slate-500">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-slate-500">
                                                {formatDateTime(user.createdAt)}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditClick(user)}
                                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteUser(user)}
                                                        disabled={deletingUserId === user.id}
                                                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                                                    >
                                                        {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {isFormOpen ? (
                <UserCreationForm
                    user={editingUser}
                    isSubmitting={isSubmitting}
                    onCancel={handleCloseForm}
                    onSubmit={handleSaveUser}
                />
            ) : null}
        </div>
    );
};

export default UserManagementPage;
