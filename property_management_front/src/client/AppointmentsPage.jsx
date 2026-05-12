import { useEffect, useState } from 'react';

const APPOINTMENTS_API_URL = 'http://localhost:8080/api/appointments';
const PROPERTIES_API_URL = 'http://localhost:8080/api/properties';

const formatDateTime = (date, time) => {
    if (!date && !time) {
        return 'Not scheduled';
    }

    return [date, time].filter(Boolean).join(' at ');
};

const getErrorMessage = (error, fallbackMessage) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
};

const AppointmentsPage = ({ currentUser }) => {
    const [appointments, setAppointments] = useState([]);
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [cancellingAppointmentId, setCancellingAppointmentId] = useState(null);

    const loadAppointments = async () => {
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

            setAppointments(
                appointmentsData.filter((appointment) => appointment.userId === currentUser?.id)
            );
            setProperties(propertiesData);
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to load appointments.'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.id) {
            loadAppointments();
        }
    }, [currentUser?.id]);

    const getPropertyById = (propertyId) => {
        return properties.find((property) => property.id === propertyId) ?? null;
    };

    const handleCancelAppointment = async (appointment) => {
        const confirmed = window.confirm('Cancel this appointment?');
        if (!confirmed) {
            return;
        }

        setCancellingAppointmentId(appointment.id);
        setErrorMessage('');

        try {
            const response = await fetch(`${APPOINTMENTS_API_URL}/${appointment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...appointment,
                    status: 'cancel'
                })
            });

            if (!response.ok) {
                throw new Error('Unable to cancel appointment.');
            }

            const updatedAppointment = await response.json();
            setAppointments((currentAppointments) =>
                currentAppointments.map((currentAppointment) =>
                    currentAppointment.id === updatedAppointment.id
                        ? updatedAppointment
                        : currentAppointment
                )
            );
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to cancel appointment.'));
        } finally {
            setCancellingAppointmentId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-300/40">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.26),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_28%)] p-8 md:p-10">
                        <div className="max-w-3xl">
                            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                Client Appointments
                            </span>
                            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                Your appointments
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
                                Track your booked property visits, review appointment status, and cancel pending or confirmed requests.
                            </p>
                        </div>
                    </div>
                </section>

                {errorMessage ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                {isLoading ? (
                    <div className="rounded-[28px] bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                        Loading appointments...
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="rounded-[28px] bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                        You have not booked any appointments yet.
                    </div>
                ) : (
                    <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <h2 className="text-lg font-semibold text-slate-900">Booked visits</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Appointment status is updated by the management team.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
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
                                        const canCancel =
                                            appointment.status === 'pending' || appointment.status === 'confirmed';

                                        return (
                                            <tr key={appointment.id} className="transition hover:bg-slate-50/80">
                                                <td className="px-6 py-5">
                                                    <div className="font-medium text-slate-900">
                                                        {property?.title ?? `Property #${appointment.propertyId}`}
                                                    </div>
                                                    <div className="mt-1 text-sm text-slate-500">
                                                        {property?.location ?? 'Location unavailable'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-600">
                                                    {formatDateTime(appointment.date, appointment.time)}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                                        {appointment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-500">
                                                    {appointment.createdAt ? new Date(appointment.createdAt).toLocaleString() : 'Not available'}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancelAppointment(appointment)}
                                                            disabled={!canCancel || cancellingAppointmentId === appointment.id}
                                                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                                                        >
                                                            {cancellingAppointmentId === appointment.id ? 'Cancelling...' : 'Cancel'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default AppointmentsPage;
