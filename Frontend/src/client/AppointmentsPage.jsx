import { useCallback, useEffect, useMemo, useState } from 'react';

const APPOINTMENTS_API_URL = 'http://localhost:8080/api/appointments';
const PROPERTIES_API_URL = 'http://localhost:8080/api/properties';

const TIME_SLOTS = [
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '16:00', label: '4:00 PM' }
];
const STATUS_TABS = ['all', 'pending', 'confirmed', 'rejected'];

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

const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

const isPastDateTime = (date, time) => {
    if (!date || !time) {
        return false;
    }

    const selectedDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    return selectedDateTime < now;
};

const getStatusBadge = (status) => {
    switch (status) {
        case 'pending':
            return '🟡 PENDING';
        case 'confirmed':
            return '🟢 CONFIRMED';
        case 'rejected':
            return '🔴 REJECTED';
        default:
            return status ? status.toUpperCase() : 'UNKNOWN';
    }
};

const AppointmentsPage = ({ currentUser }) => {
    const [allAppointments, setAllAppointments] = useState([]);
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [activeStatus, setActiveStatus] = useState('all');
    const [cancellingAppointmentId, setCancellingAppointmentId] = useState(null);
    const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
    const [rescheduleValues, setRescheduleValues] = useState({ date: '', time: '' });
    const [rescheduleAvailability, setRescheduleAvailability] = useState('');
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [viewStatusAppointment, setViewStatusAppointment] = useState(null);

    const loadPageData = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const [appointmentsResponse, propertiesResponse] = await Promise.all([
                fetch(APPOINTMENTS_API_URL),
                fetch(PROPERTIES_API_URL)
            ]);

            if (!appointmentsResponse.ok) {
                throw new Error('Unable to load appointments.');
            }

            if (!propertiesResponse.ok) {
                throw new Error('Unable to load properties.');
            }

            const [appointmentsData, propertiesData] = await Promise.all([
                appointmentsResponse.json(),
                propertiesResponse.json()
            ]);

            setAllAppointments(appointmentsData);
            setProperties(propertiesData);
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to load appointments.'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!currentUser?.id) {
            return;
        }

        const timer = setTimeout(() => {
            void loadPageData();
        }, 0);

        return () => clearTimeout(timer);
    }, [loadPageData, currentUser?.id]);

    // Overrides window storage event to sync data across tabs
    useEffect(() => {
        const handleAppointmentsUpdated = () => {
            void loadPageData();// Overriding the default storage behavior
        };

        const handleStorage = (event) => {
            if (event.key === 'appointmentsUpdated') {
                void loadPageData();// Custom override for storage changes
            }
        };

        // Overriding default window events with custom handlers
        window.addEventListener('appointmentsUpdated', handleAppointmentsUpdated);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('appointmentsUpdated', handleAppointmentsUpdated);
            window.removeEventListener('storage', handleStorage);
        };
    }, [loadPageData]);

    const userAppointments = useMemo(
        () => allAppointments.filter((appointment) => appointment.userId === currentUser?.id),
        [allAppointments, currentUser?.id]
    );

    const filteredAppointments = useMemo(
        () =>
            userAppointments.filter(
                (appointment) => activeStatus === 'all' || appointment.status === activeStatus
            ),
        [userAppointments, activeStatus]
    );

    const getPropertyById = (propertyId) => {
        return (
            properties.find((property) =>
                property.id === Number(propertyId) || property.id === propertyId
            ) ?? null
        );
    };

    // Collision validation - check if time slot is already booked
    const checkAppointmentCollision = ({ propertyId, date, time, excludeId = null }) => {
        const normalizedDate = normalizeDateValue(date);
        const normalizedTime = normalizeTimeValue(time);

        return allAppointments.some((appointment) => {
            if (excludeId && appointment.id === excludeId) {
                return false;
            }

            return (
                appointment.propertyId === Number(propertyId) &&
                normalizeDateValue(appointment.date) === normalizedDate &&
                normalizeTimeValue(appointment.time) === normalizedTime &&
                appointment.status !== 'rejected' &&
                appointment.status !== 'cancel'
            );
        });
    };

    const handleFilterChange = (status) => {
        setActiveStatus(status);
    };

    const startReschedule = (appointment) => {
        setRescheduleAppointment(appointment);
        setRescheduleValues({
            date: appointment.date || '',
            time: normalizeTimeValue(appointment.time) || TIME_SLOTS[0].value
        });
        setRescheduleAvailability('');
    };

    const closeReschedule = () => {
        setRescheduleAppointment(null);
        setRescheduleValues({ date: '', time: '' });
        setRescheduleAvailability('');
    };

    const handleRescheduleChange = (event) => {
        const { name, value } = event.target;
        setRescheduleValues((currentValues) => ({
            ...currentValues,
            [name]: value
        }));
        setRescheduleAvailability('');
    };

    const handleCheckRescheduleAvailability = () => {
        if (!rescheduleAppointment) {
            return;
        }

        const { propertyId } = rescheduleAppointment;
        const { date, time } = rescheduleValues;

        // Availability validation before reschedule
        if (!date || !time) {
            setRescheduleAvailability('Select new date and time to check availability.');
            return;
        }

        if (isPastDateTime(date, time)) {
            setRescheduleAvailability('❌ Cannot reschedule to past dates or times.');
            return;
        }

        const isBooked = checkAppointmentCollision({
            propertyId,
            date,
            time,
            excludeId: rescheduleAppointment.id
        });

        setRescheduleAvailability(
            isBooked ? '❌ This slot is already booked.' : '✅ Time slot available!'
        );
    };

    const handleSaveReschedule = async (event) => {
        event.preventDefault();

        if (!rescheduleAppointment) {
            return;
        }

        const { date, time } = rescheduleValues;
        if (!date || !time) {
            setRescheduleAvailability('Select a new date and time before saving.');
            return;
        }

        if (isPastDateTime(date, time)) {
            setRescheduleAvailability('❌ Cannot reschedule to past dates or times.');
            return;
        }

        // Final validation before saving reschedule
        const isBooked = checkAppointmentCollision({
            propertyId: rescheduleAppointment.propertyId,
            date,
            time,
            excludeId: rescheduleAppointment.id
        });

        if (isBooked) {
            setRescheduleAvailability('❌ This slot is already booked. Please select a different time.');
            return;
        }

        setIsRescheduling(true);
        setErrorMessage('');

        try {
            const normalizedDate = normalizeDateValue(date);
            const normalizedTime = normalizeTimeValue(time);
            
            // UPDATE (Reschedule) - handleSaveReschedule function.
            const response = await fetch(`${APPOINTMENTS_API_URL}/${rescheduleAppointment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: Number(rescheduleAppointment.userId),
                    propertyId: Number(rescheduleAppointment.propertyId),
                    date: normalizedDate,
                    time: normalizedTime,
                    status: rescheduleAppointment.status || 'pending'
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Unable to reschedule appointment.');
            }

            setRescheduleAvailability('✅ Appointment rescheduled successfully!');
            await loadPageData();
            setTimeout(() => {
                closeReschedule();
            }, 1500);
        } catch (error) {
            setRescheduleAvailability(getErrorMessage(error, 'Unable to reschedule appointment.'));
        } finally {
            setIsRescheduling(false);
        }
    };

    const handleCancelAppointment = async (appointment) => {
        // User confirmation validation before cancellation
        const confirmed = window.confirm('Cancel this appointment?');
        if (!confirmed) {
            return;
        }

        setCancellingAppointmentId(appointment.id);
        setErrorMessage('');

        try {
            // UPDATE (Cancel) - handleCancelAppointment function.
            const response = await fetch(`${APPOINTMENTS_API_URL}/${appointment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...appointment,
                    time: normalizeTimeValue(appointment.time),
                    status: 'cancel'
                })
            });

            if (!response.ok) {
                throw new Error('Unable to cancel appointment.');
            }

            await loadPageData();
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to cancel appointment.'));
        } finally {
            setCancellingAppointmentId(null);
        }
    };

    const handleViewStatus = (appointment) => {
        setViewStatusAppointment(appointment);
    };

    const closeViewStatus = () => {
        setViewStatusAppointment(null);
    };

    const handleDeleteAppointment = async (appointment) => {
        const confirmed = window.confirm('Permanently delete this appointment? This action cannot be undone.');
        if (!confirmed) {
            return;
        }

        setErrorMessage('');

        try {
            // DELETE - handleDeleteAppointment function.
            const response = await fetch(`${APPOINTMENTS_API_URL}/${appointment.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Unable to delete appointment.');
            }

            await loadPageData();
            window.dispatchEvent(new Event('appointmentsUpdated'));
            localStorage.setItem('appointmentsUpdated', Date.now().toString());
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to delete appointment.'));
        }
    };

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
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.26),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_28%)] p-8 md:p-10">
                        <div className="max-w-3xl">
                            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                My appointments
                            </span>
                            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                Your upcoming bookings
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
                                Review your bookings, reschedule appointments, and see status details.
                            </p>
                        </div>
                    </div>
                </section>

                {errorMessage ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                    <div className="border-b border-slate-200 px-6 py-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">My appointments</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Filter and manage your appointment requests.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_TABS.map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => handleFilterChange(status)}
                                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                            activeStatus === status
                                                ? 'bg-slate-900 text-white'
                                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 px-6 py-6">
                        {filteredAppointments.length === 0 ? (
                            <div className="rounded-[28px] bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
                                No appointments found for the selected filter.
                            </div>
                        ) : (
                            filteredAppointments.map((appointment) => {
                                const property = getPropertyById(appointment.propertyId);

                                return (
                                    <div
                                        key={appointment.id}
                                        className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-20 w-28 overflow-hidden rounded-3xl bg-slate-200">
                                                    {property?.image ? (
                                                        <img
                                                            src={property.image}
                                                            alt={property.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                                            No image
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-semibold text-slate-900">
                                                        {property?.title ?? `Property #${appointment.propertyId}`}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {property?.location ?? 'Location unavailable'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm text-slate-600">
                                                <div>Date: {appointment.date || 'Not scheduled'}</div>
                                                <div>Time: {appointment.time || 'Not scheduled'}</div>
                                                <div>Status: {getStatusBadge(appointment.status)}</div>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex flex-wrap gap-3">
                                            {appointment.status !== 'cancel' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => startReschedule(appointment)}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                                    >
                                                        Reschedule
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancelAppointment(appointment)}
                                                        disabled={cancellingAppointmentId === appointment.id}
                                                        className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                                                    >
                                                        {cancellingAppointmentId === appointment.id ? 'Cancelling...' : 'Cancel Appointment'}
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleViewStatus(appointment)}
                                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                            >
                                                View Status
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteAppointment(appointment)}
                                                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                                                title="Permanently delete this appointment"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>

            {rescheduleAppointment ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/15">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <h2 className="text-2xl font-semibold text-slate-900">Reschedule appointment</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Select a new date and time for your booking request.
                            </p>
                        </div>

                        <form onSubmit={handleSaveReschedule} className="space-y-6 px-6 py-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    New date
                                    <input
                                        type="date"
                                        name="date"
                                        value={rescheduleValues.date}
                                        onChange={handleRescheduleChange}
                                        min={getTodayDateString()}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                    />
                                </label>
                                <label className="space-y-2 text-sm font-medium text-slate-700">
                                    New time
                                    <select
                                        name="time"
                                        value={rescheduleValues.time}
                                        onChange={handleRescheduleChange}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                    >
                                        {TIME_SLOTS.map((slot) => (
                                            <option key={slot.value} value={slot.value}>
                                                {slot.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleCheckRescheduleAvailability}
                                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                                >
                                    Check Availability
                                </button>
                                <span className="text-sm text-slate-500">{rescheduleAvailability || 'Check if the new slot is free.'}</span>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeReschedule}
                                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRescheduling}
                                    className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                                >
                                    {isRescheduling ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {viewStatusAppointment ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/15">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <h2 className="text-2xl font-semibold text-slate-900">Appointment details</h2>
                        </div>

                        <div className="space-y-4 px-6 py-6">
                            <div className="rounded-3xl bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-700">Property</p>
                                <p className="mt-2 text-base font-semibold text-slate-900">
                                    {getPropertyById(viewStatusAppointment.propertyId)?.title ?? `Property #${viewStatusAppointment.propertyId}`}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    {getPropertyById(viewStatusAppointment.propertyId)?.location ?? 'Location unavailable'}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-3xl bg-slate-50 p-4">
                                    <p className="text-sm font-semibold text-slate-700">Date</p>
                                    <p className="mt-2 text-slate-900">{viewStatusAppointment.date || 'Not scheduled'}</p>
                                </div>
                                <div className="rounded-3xl bg-slate-50 p-4">
                                    <p className="text-sm font-semibold text-slate-700">Time</p>
                                    <p className="mt-2 text-slate-900">{viewStatusAppointment.time || 'Not scheduled'}</p>
                                </div>
                            </div>

                            <div className="rounded-3xl bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-700">Status</p>
                                <p className="mt-2 text-slate-900">{getStatusBadge(viewStatusAppointment.status)}</p>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={closeViewStatus}
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

export default AppointmentsPage;
