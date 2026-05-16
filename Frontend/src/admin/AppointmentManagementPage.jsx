import { useEffect, useMemo, useState } from 'react';

const APPOINTMENTS_API_URL = 'http://localhost:8080/api/appointments';
const USERS_API_URL = 'http://localhost:8080/api/users';
const PROPERTIES_API_URL = 'http://localhost:8080/api/properties';

// Error message helper with validation.
const getErrorMessage = (error, fallbackMessage) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
};

const normalizeTimeValue = (value) => {
    if (!value) {
        return '';
    }

    const trimmed = String(value).trim();
    const amPmMatch = trimmed.match(/^([0-9]{1,2}):([0-9]{2})\s*([AaPp][Mm])$/);

    if (amPmMatch) {
        let hour = Number(amPmMatch[1]);
        const minute = amPmMatch[2];
        const period = amPmMatch[3].toUpperCase();

        if (period === 'PM' && hour < 12) {
            hour += 12;
        }
        if (period === 'AM' && hour === 12) {
            hour = 0;
        }

        return `${String(hour).padStart(2, '0')}:${minute}`;
    }

    const timeMatch = trimmed.match(/^([0-9]{1,2}):([0-9]{2})(?::[0-9]{2})?$/);
    if (timeMatch) {
        return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }

    return trimmed;
};

const normalizeDateValue = (value) => {
    if (!value) {
        return '';
    }

    const trimmed = String(value).trim();
    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(trimmed)) {
        return trimmed;
    }

    const parts = trimmed.split(/[./]/);
    if (parts.length === 3) {
        const [part1, part2, part3] = parts;
        if (part1.length === 4) {
            return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`;
        }

        return `${part3.padStart(4, '0')}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
    }

    return trimmed;
};

const AppointmentManagementPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [users, setUsers] = useState([]);
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedAppointmentIds, setSelectedAppointmentIds] = useState([]);
    const [detailAppointment, setDetailAppointment] = useState(null);

    // READ -(loadPageData function)
    const loadPageData = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const [appointmentsResponse, usersResponse, propertiesResponse] = await Promise.all([
                fetch(APPOINTMENTS_API_URL),// READ all appointments
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

    const filteredAppointments = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return appointments.filter((appointment) => {
            const property = getPropertyById(appointment.propertyId);
            const userName = getUserNameById(appointment.userId).toLowerCase();
            const propertyTitle = property?.title?.toLowerCase() ?? '';
            const propertyLocation = property?.location?.toLowerCase() ?? '';
            const appointmentId = String(appointment.id);
            const matchesSearch =
                !query ||
                userName.includes(query) ||
                propertyTitle.includes(query) ||
                propertyLocation.includes(query) ||
                appointmentId.includes(query);
            const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [appointments, searchQuery, statusFilter, properties]);

    const selectedCount = selectedAppointmentIds.length;
    const isAllSelected =
        filteredAppointments.length > 0 &&
        filteredAppointments.every((appointment) => selectedAppointmentIds.includes(appointment.id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedAppointmentIds([]);
            return;
        }

        setSelectedAppointmentIds(filteredAppointments.map((appointment) => appointment.id));
    };

    const toggleSelectAppointment = (appointmentId) => {
        setSelectedAppointmentIds((currentIds) =>
            currentIds.includes(appointmentId)
                ? currentIds.filter((id) => id !== appointmentId)
                : [...currentIds, appointmentId]
        );
    };

    const openDetailView = (appointment) => {
        setDetailAppointment(appointment);
    };

    const closeDetailView = () => {
        setDetailAppointment(null);
    };

    const updateStatusForAppointment = async (appointment, newStatus) => {
        // Validation - check if appointment exists
        if (!appointment) {
            return;
        }

        setErrorMessage('');

        try {
            // CONSTRUCTOR - Creating new appointment object for API call
            const response = await fetch(`${APPOINTMENTS_API_URL}/${appointment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({// Object literal constructor
                    id: appointment.id,
                    userId: Number(appointment.userId),
                    propertyId: Number(appointment.propertyId),
                    date: normalizeDateValue(appointment.date),
                    time: normalizeTimeValue(appointment.time),
                    status: newStatus
                })
            });

            // HTTP response validation
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Unable to update appointment status.');
            }

            await loadPageData();
            window.dispatchEvent(new Event('appointmentsUpdated'));
            localStorage.setItem('appointmentsUpdated', Date.now().toString());

            if (detailAppointment?.id === appointment.id) {
                setDetailAppointment({ ...appointment, status: newStatus });
            }
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to update appointment status.'));
        }
    };

    const bulkUpdateStatus = async (newStatus) => {
        if (selectedAppointmentIds.length === 0) {
            return;
        }

        setErrorMessage('');

        try {
            await Promise.all(
                appointments
                    .filter((appointment) => selectedAppointmentIds.includes(appointment.id))
                    .map((appointment) =>
                        fetch(`${APPOINTMENTS_API_URL}/${appointment.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                userId: Number(appointment.userId),
                                propertyId: Number(appointment.propertyId),
                                date: normalizeDateValue(appointment.date),
                                time: normalizeTimeValue(appointment.time),
                                status: newStatus
                            })
                        }).then((response) => {
                            if (!response.ok) {
                                throw new Error('Unable to update one or more appointments.');
                            }
                        })
                    )
            );

            setSelectedAppointmentIds([]);
            await loadPageData();
            if (detailAppointment && selectedAppointmentIds.includes(detailAppointment.id)) {
                setDetailAppointment({ ...detailAppointment, status: newStatus });
            }
            window.dispatchEvent(new Event('appointmentsUpdated'));
            localStorage.setItem('appointmentsUpdated', Date.now().toString());
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to update selected appointments.'));
        }
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleFilterChange = (event) => {
        setStatusFilter(event.target.value);
    };

    const handleSendNotification = () => {
        if (!detailAppointment) {
            return;
        }

        window.alert(
            `Notification sent to ${getUserNameById(detailAppointment.userId)} for appointment #${detailAppointment.id}.`
        );
    };

    const pendingCount = appointments.filter((appointment) => appointment.status === 'pending').length;
    const confirmedCount = appointments.filter((appointment) => appointment.status === 'confirmed').length;
    const completedCount = appointments.filter((appointment) => appointment.status === 'completed').length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-100 p-6 md:p-8">
                <div className="mx-auto max-w-7xl rounded-[28px] bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    Loading appointments...
                </div>
            </div>
        );
    }

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
                    
                </section>

                <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                    <div className="space-y-4 border-b border-slate-200 px-6 py-5 sm:flex sm:items-center sm:justify-between sm:space-y-0">
                        <div className="space-y-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Booking management</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Search, filter, and manage bookings from a single admin panel.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <label className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                    <span className="whitespace-nowrap font-semibold">Search</span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        placeholder="Search by user, property, or booking ID"
                                        className="w-full bg-transparent outline-none"
                                    />
                                </label>
                                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                    <span className="whitespace-nowrap font-semibold">Status</span>
                                    <select
                                        value={statusFilter}
                                        onChange={handleFilterChange}
                                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                                    >
                                        <option value="all">All</option>
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="cancel">Cancelled</option>
                                    </select>
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={toggleSelectAll}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                {isAllSelected ? 'Deselect all' : 'Select all'}
                            </button>
                            <button
                                type="button"
                                onClick={loadPageData}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>

                   

                    {filteredAppointments.length === 0 ? (
                        <div className="px-6 py-10 text-sm text-slate-500">
                            No appointments match your filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            <span className="sr-only">Select</span>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Client</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Property</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Time</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAppointments.map((appointment) => {
                                        const property = getPropertyById(appointment.propertyId);
                                        const isSelected = selectedAppointmentIds.includes(appointment.id);

                                        return (
                                            <tr
                                                key={appointment.id}
                                                className="cursor-pointer transition hover:bg-slate-50/80"
                                                onClick={() => openDetailView(appointment)}
                                            >
                                                <td className="px-6 py-5">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(event) => {
                                                            event.stopPropagation();
                                                            toggleSelectAppointment(appointment.id);
                                                        }}
                                                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                                                    />
                                                </td>
                                                <td className="px-6 py-5 text-sm font-medium text-slate-900">
                                                    {appointment.id}
                                                </td>
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
                                                    {appointment.date || 'No date'}
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-600">
                                                    {appointment.time || 'No time'}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                                        {appointment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                updateStatusForAppointment(appointment, 'confirmed');
                                                            }}
                                                            className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                updateStatusForAppointment(appointment, 'rejected');
                                                            }}
                                                            className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-400"
                                                        >
                                                            Reject
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

            {detailAppointment ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/15">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <h2 className="text-2xl font-semibold text-slate-900">Appointment details</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Review the booking and apply admin actions directly from here.
                            </p>
                        </div>

                        <div className="space-y-4 px-6 py-6">
                            <div className="rounded-3xl bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-700">Booking ID</p>
                                <p className="mt-2 text-base font-semibold text-slate-900">#{detailAppointment.id}</p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-3xl bg-slate-50 p-4">
                                    <p className="text-sm font-semibold text-slate-700">User</p>
                                    <p className="mt-2 text-base font-semibold text-slate-900">
                                        {getUserNameById(detailAppointment.userId)}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">User ID: {detailAppointment.userId}</p>
                                </div>
                                <div className="rounded-3xl bg-slate-50 p-4">
                                    <p className="text-sm font-semibold text-slate-700">Property</p>
                                    <p className="mt-2 text-base font-semibold text-slate-900">
                                        {getPropertyById(detailAppointment.propertyId)?.title ?? `Property #${detailAppointment.propertyId}`}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        ID: {detailAppointment.propertyId}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-3xl bg-slate-50 p-4">
                                    <p className="text-sm font-semibold text-slate-700">Requested Date</p>
                                    <p className="mt-2 text-slate-900">{detailAppointment.date || 'N/A'}</p>
                                </div>
                                <div className="rounded-3xl bg-slate-50 p-4">
                                    <p className="text-sm font-semibold text-slate-700">Requested Time</p>
                                    <p className="mt-2 text-slate-900">{detailAppointment.time || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="rounded-3xl bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-700">Status</p>
                                <p className="mt-2 text-slate-900">{detailAppointment.status?.toUpperCase() || 'UNKNOWN'}</p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => updateStatusForAppointment(detailAppointment, 'confirmed')}
                                        className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateStatusForAppointment(detailAppointment, 'rejected')}
                                        className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-400"
                                    >
                                        Reject
                                    </button>
                                </div>
                                
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={closeDetailView}
                                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default AppointmentManagementPage;
