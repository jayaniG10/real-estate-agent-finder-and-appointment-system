import { useEffect, useState } from 'react';
import PropertyCreationForm from './components/PropertyCreationForm';

const PROPERTIES_API_URL = 'http://localhost:8080/api/properties';
const USERS_API_URL = 'http://localhost:8080/api/users';

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

const formatPrice = (value) => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
        return value || 'Not available';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2
    }).format(numericValue);
};

const getErrorMessage = (error, fallbackMessage) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
};

const PropertyManagementPage = ({ currentUser, onOpenPropertyDetails }) => {
    const [properties, setProperties] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingPropertyId, setDeletingPropertyId] = useState(null);

    const loadUsers = async () => {
        const response = await fetch(USERS_API_URL);

        if (!response.ok) {
            throw new Error('Unable to load users for property assignment.');
        }

        const data = await response.json();
        setUsers(data);
    };

    const loadProperties = async () => {
        const response = await fetch(PROPERTIES_API_URL);

        if (!response.ok) {
            throw new Error('Unable to load properties.');
        }

        const data = await response.json();
        setProperties(data);
    };

    const loadPageData = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            await Promise.all([loadProperties(), loadUsers()]);
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to load property data.'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPageData();
    }, []);

    const handleCreateClick = () => {
        setEditingProperty(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (property) => {
        setEditingProperty(property);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        if (isSubmitting) {
            return;
        }

        setIsFormOpen(false);
        setEditingProperty(null);
    };

    const handleSaveProperty = async (formValues) => {
        setIsSubmitting(true);
        setErrorMessage('');

        const isEditing = Boolean(editingProperty?.id);
        const endpoint = isEditing
            ? `${PROPERTIES_API_URL}/${editingProperty.id}`
            : PROPERTIES_API_URL;
        const method = isEditing ? 'PUT' : 'POST';
        const payload = {
            ...formValues,
            ...(isEditing
                ? { id: editingProperty.id, createdAt: editingProperty.createdAt ?? null }
                : {})
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
                throw new Error(isEditing ? 'Unable to update property.' : 'Unable to create property.');
            }

            await loadPageData();
            setIsFormOpen(false);
            setEditingProperty(null);
        } catch (error) {
            setErrorMessage(
                getErrorMessage(
                    error,
                    isEditing ? 'Unable to update property.' : 'Unable to create property.'
                )
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProperty = async (property) => {
        const confirmed = window.confirm(`Delete property "${property.title}"?`);
        if (!confirmed) {
            return;
        }

        setDeletingPropertyId(property.id);
        setErrorMessage('');

        try {
            const response = await fetch(`${PROPERTIES_API_URL}/${property.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Unable to delete property.');
            }

            setProperties((currentProperties) =>
                currentProperties.filter((currentProperty) => currentProperty.id !== property.id)
            );
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to delete property.'));
        } finally {
            setDeletingPropertyId(null);
        }
    };

    const getUserNameById = (userId) => {
        if (!userId) {
            return 'Unassigned';
        }

        return users.find((user) => user.id === userId)?.name ?? `User #${userId}`;
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-300/40">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.3),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.2),_transparent_30%)] p-8 md:p-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                    Admin Console
                                </span>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                    Property management
                                </h1>
                            </div>
                            <button
                                type="button"
                                onClick={handleCreateClick}
                                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                            >
                                Add property
                            </button>
                        </div>
                    </div>
                </section>

                {errorMessage ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                <section className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Total properties</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{properties.length}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Available</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">
                            {properties.filter((property) => property.status === 'available').length}
                        </p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Sold</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">
                            {properties.filter((property) => property.status === 'sold').length}
                        </p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Rented</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">
                            {properties.filter((property) => property.status === 'rented').length}
                        </p>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">All properties</h2>
                            <p className="mt-1 text-sm text-slate-500">Create, update, and remove property listings.</p>
                        </div>
                        <button
                            type="button"
                            onClick={loadPageData}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                            Refresh
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="px-6 py-16 text-center text-sm text-slate-500">
                            Loading properties...
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="px-6 py-16 text-center text-sm text-slate-500">
                            No properties found. Add the first listing to get started.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Property
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Price
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Added by
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Created
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Details
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {properties.map((property) => (
                                        <tr
                                            key={property.id}
                                            className="cursor-pointer transition hover:bg-slate-50/80"
                                            onClick={() => onOpenPropertyDetails?.(property.id)}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="font-medium text-slate-900">{property.title}</div>
                                                <div className="mt-1 text-sm text-slate-500">{property.location}</div>
                                                <div className="mt-2 line-clamp-2 max-w-md text-sm text-slate-400">
                                                    {property.description || 'No description provided.'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-medium text-slate-700">
                                                {formatPrice(property.price)}
                                            </td>
                                            <td className="px-6 py-5 text-sm text-slate-500">
                                                {getUserNameById(property.addedBy)}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                                    {property.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-slate-500">
                                                {formatDateTime(property.createdAt)}
                                            </td>
                                            <td className="px-6 py-5 text-sm font-medium text-blue-700">
                                                View details
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleEditClick(property);
                                                        }}
                                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleDeleteProperty(property);
                                                        }}
                                                        disabled={deletingPropertyId === property.id}
                                                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                                                    >
                                                        {deletingPropertyId === property.id ? 'Deleting...' : 'Delete'}
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
                <PropertyCreationForm
                    property={editingProperty}
                    currentUser={currentUser}
                    isSubmitting={isSubmitting}
                    onCancel={handleCloseForm}
                    onSubmit={handleSaveProperty}
                />
            ) : null}
        </div>
    );
};

export default PropertyManagementPage;
