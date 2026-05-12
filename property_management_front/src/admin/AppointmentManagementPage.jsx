import { useEffect, useState } from 'react';

const APPOINTMENTS_API_URL = 'http://localhost:8080/api/appointments';
const USERS_API_URL = 'http://localhost:8080/api/users';
const PROPERTIES_API_URL = 'http://localhost:8080/api/properties';

const INITIAL_FORM_VALUES = {
    userId: '',
    propertyId: '',
    date: '',
    time: '',
    status: 'pending'
};

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

const AppointmentManagementPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [users, setUsers] = useState([]);
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingAppointmentId, setDeletingAppointmentId] = useState(null);

    const loadPageData = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const [appointmentsResponse, usersResponse, propertiesResponse] = await Promise.all([
                fetch(APPOINTMENTS_API_URL),
                fetch(USERS_API_URL),
                fetch(PROPERTIES_API_URL)
            ]);

            if (!appointmentsResponse.ok) {
                throw new Error('Unable to load appointments.');
            }

            if (!usersResponse.ok) {
                throw new Error('Unable to load users.');
            }

            if (!propertiesResponse.ok) {
                throw new Error('Unable to load properties.');
            }

            const [appointmentsData, usersData, propertiesData] = await Promise.all([
                appointmentsResponse.json(),
                usersResponse.json(),
                propertiesResponse.json()
            ]);

            setAppointments(appointmentsData);
            setUsers(usersData);
            setProperties(propertiesData);
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to load appointment data.'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPageData();
    }, []);

    const getUserNameById = (userId) => {
        if (!userId) {
            return 'Unknown user';
        }

        return users.find((user) => user.id === userId)?.name ?? `User #${userId}`;
    };

    const getPropertyById = (propertyId) => {
        if (!propertyId) {
            return null;
        }

        return properties.find((property) => property.id === propertyId) ?? null;
    };

    const openCreateForm = () => {
        setEditingAppointment(null);
        setFormValues(INITIAL_FORM_VALUES);
        setFormError('');
        setIsFormOpen(true);
    };

    const openEditForm = (appointment) => {
        setEditingAppointment(appointment);
        setFormValues({
            userId: appointment.userId ? String(appointment.userId) : '',
            propertyId: appointment.propertyId ? String(appointment.propertyId) : '',
            date: appointment.date ?? '',
            time: appointment.time ?? '',
            status: appointment.status ?? 'pending'
        });
        setFormError('');
        setIsFormOpen(true);
    };

    const closeForm = () => {
        if (isSubmitting) {
            return;
        }

        setIsFormOpen(false);
        setEditingAppointment(null);
        setFormValues(INITIAL_FORM_VALUES);
        setFormError('');
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((currentValues) => ({
            ...currentValues,
            [name]: value
        }));
    };

    const handleSaveAppointment = async (event) => {
        event.preventDefault();

        const normalizedValues = {
            userId: formValues.userId ? Number(formValues.userId) : null,
            propertyId: formValues.propertyId ? Number(formValues.propertyId) : null,
            date: formValues.date,
            time: formValues.time,
            status: formValues.status
        };

        if (!normalizedValues.userId || !normalizedValues.propertyId || !normalizedValues.date || !normalizedValues.time) {
            setFormError('User, property, date, and time are required.');
            return;
        }

        setIsSubmitting(true);
        setFormError('');
        setErrorMessage('');

        const isEditing = Boolean(editingAppointment?.id);
        const endpoint = isEditing ? `${APPOINTMENTS_API_URL}/${editingAppointment.id}` : APPOINTMENTS_API_URL;
        const method = isEditing ? 'PUT' : 'POST';
        const payload = {
            ...normalizedValues,
            ...(isEditing
                ? { id: editingAppointment.id, createdAt: editingAppointment.createdAt ?? null }
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
                throw new Error(isEditing ? 'Unable to update appointment.' : 'Unable to create appointment.');
            }

            await loadPageData();
            closeForm();
        } catch (error) {
            setFormError(
                getErrorMessage(
                    error,
                    isEditing ? 'Unable to update appointment.' : 'Unable to create appointment.'
                )
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAppointment = async (appointment) => {
        const confirmed = window.confirm(
            `Delete appointment for ${getUserNameById(appointment.userId)}?`
        );

        if (!confirmed) {
            return;
        }

        setDeletingAppointmentId(appointment.id);
        setErrorMessage('');

        try {
            const response = await fetch(`${APPOINTMENTS_API_URL}/${appointment.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Unable to delete appointment.');
            }

            setAppointments((currentAppointments) =>
                currentAppointments.filter((currentAppointment) => currentAppointment.id !== appointment.id)
            );
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to delete appointment.'));
        } finally {
            setDeletingAppointmentId(null);
        }
    };

    const pendingCount = appointments.filter((appointment) => appointment.status === 'pending').length;
    const confirmedCount = appointments.filter((appointment) => appointment.status === 'confirmed').length;
    const completedCount = appointments.filter((appointment) => appointment.status === 'completed').length;

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-300/40">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.3),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.18),_transparent_30%)] p-8 md:p-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                    Admin Console
                                </span>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                    Appointment management
                                </h1>
                            </div>
                            <button
                                type="button"
                                onClick={openCreateForm}
                                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                            >
                                Add appointment
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
                        <p className="text-sm font-medium text-slate-500">Total appointments</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{appointments.length}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Pending</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{pendingCount}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Confirmed</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{confirmedCount}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Completed</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{completedCount}</p>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">All appointments</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Review appointment status, users, properties, and schedules.
                            </p>
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
                            Loading appointments...
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="px-6 py-16 text-center text-sm text-slate-500">
                            No appointments found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Client
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Property
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Schedule
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Status
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
                                    {appointments.map((appointment) => {
                                        const property = getPropertyById(appointment.propertyId);

                                        return (
                                            <tr key={appointment.id} className="transition hover:bg-slate-50/80">
                                                <td className="px-6 py-5">
                                                    <div className="font-medium text-slate-900">
                                                        {getUserNameById(appointment.userId)}
                                                    </div>
                                                    <div className="mt-1 text-sm text-slate-500">
                                                        User ID: {appointment.userId}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="font-medium text-slate-900">
                                                        {property?.title ?? `Property #${appointment.propertyId}`}
                                                    </div>
                                                    <div className="mt-1 text-sm text-slate-500">
                                                        {property?.location ?? 'Location unavailable'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-600">
                                                    <div>{appointment.date || 'No date set'}</div>
                                                    <div className="mt-1 text-slate-500">{appointment.time || 'No time set'}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                                        {appointment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-500">
                                                    {formatDateTime(appointment.createdAt)}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditForm(appointment)}
                                                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteAppointment(appointment)}
                                                            disabled={deletingAppointmentId === appointment.id}
                                                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                                                        >
                                                            {deletingAppointmentId === appointment.id ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {isFormOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/15">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <h2 className="text-2xl font-semibold text-slate-900">
                                {editingAppointment ? 'Edit appointment' : 'Create appointment'}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {editingAppointment
                                    ? 'Review appointment details and update only the current status.'
                                    : 'Assign a client, property, schedule, and current appointment status.'}
                            </p>
                        </div>

                        <form onSubmit={handleSaveAppointment} className="space-y-6 px-6 py-6">
                            {formError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {formError}
                                </div>
                            ) : null}

                            {editingAppointment ? (
                                <>
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700">Client</span>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {getUserNameById(Number(formValues.userId))}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    User ID: {formValues.userId || 'Not available'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700">Property</span>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {getPropertyById(Number(formValues.propertyId))?.title ??
                                                        `Property #${formValues.propertyId}`}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {getPropertyById(Number(formValues.propertyId))?.location ??
                                                        'Location unavailable'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-5 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700">Date</span>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                                                {formValues.date || 'No date set'}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700">Time</span>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                                                {formValues.time || 'No time set'}
                                            </div>
                                        </div>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700">Status</span>
                                            <select
                                                name="status"
                                                value={formValues.status}
                                                onChange={handleChange}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="cancel">Cancel</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </label>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700">Client</span>
                                            <select
                                                name="userId"
                                                value={formValues.userId}
                                                onChange={handleChange}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                            >
                                                <option value="">Select client</option>
                                                {users.map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name} ({user.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700">Property</span>
                                            <select
                                                name="propertyId"
                                                value={formValues.propertyId}
                                                onChange={handleChange}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                            >
                                                <option value="">Select property</option>
                                                {properties.map((property) => (
                                                    <option key={property.id} value={property.id}>
                                                        {property.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>

                                    <div className="grid gap-5 md:grid-cols-3">
                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700">Date</span>
                                            <input
                                                type="date"
                                                name="date"
                                                value={formValues.date}
                                                onChange={handleChange}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                            />
                                        </label>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700">Time</span>
                                            <input
                                                type="time"
                                                name="time"
                                                value={formValues.time}
                                                onChange={handleChange}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                            />
                                        </label>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700">Status</span>
                                            <select
                                                name="status"
                                                value={formValues.status}
                                                onChange={handleChange}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="cancel">Cancel</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </label>
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeForm}
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
                                        ? editingAppointment
                                            ? 'Saving changes...'
                                            : 'Creating appointment...'
                                        : editingAppointment
                                          ? 'Save changes'
                                          : 'Create appointment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default AppointmentManagementPage;
