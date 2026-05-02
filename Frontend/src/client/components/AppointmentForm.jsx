import { useEffect, useState } from 'react';

const INITIAL_FORM_VALUES = {
    date: '',
    time: '',
    notes: ''
};

const AppointmentForm = ({ propertyTitle, isSubmitting, onCancel, onSubmit, onCheckAvailability }) => {
    const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
    const [errorMessage, setErrorMessage] = useState('');
    const [availabilityMessage, setAvailabilityMessage] = useState('');

    useEffect(() => {
        setFormValues(INITIAL_FORM_VALUES);
        setErrorMessage('');
        setAvailabilityMessage('');
    }, [propertyTitle]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((currentValues) => ({
            ...currentValues,
            [name]: value
        }));

        if (availabilityMessage) {
            setAvailabilityMessage('');
        }
    };

    const isPastDateTime = () => {
        if (!formValues.date || !formValues.time) {
            return false;
        }

        const selectedDate = new Date(`${formValues.date}T${formValues.time}`);
        const now = new Date();
        return selectedDate < now;
    };

    const handleCheckAvailability = () => {
        if (!formValues.date || !formValues.time) {
            setAvailabilityMessage('Select date and time to check availability.');
            return;
        }

        if (isPastDateTime()) {
            setAvailabilityMessage('❌ Cannot book appointments for past dates or times.');
            return;
        }

        if (!onCheckAvailability) {
            setAvailabilityMessage('Availability checks are not available right now.');
            return;
        }

        setAvailabilityMessage(onCheckAvailability({
            date: formValues.date,
            time: formValues.time
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        //Form validation - check required fields
        if (!formValues.date || !formValues.time) {
            setErrorMessage('Date and time are required.');
            return;
        }

        if (isPastDateTime()) {
            setErrorMessage('❌ Cannot book appointments for past dates or times.');
            return;
        }

        setErrorMessage('');
        await onSubmit({
            date: formValues.date,
            time: formValues.time,
            notes: formValues.notes,
            status: 'pending'
        });
    };

    const getTodayDateString = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/15">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-2xl font-semibold text-slate-900">Book appointment</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Request a visit for <span className="font-medium text-slate-700">{propertyTitle}</span>.
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
                            <span className="text-sm font-medium text-slate-700">Preferred date</span>
                            <input
                                type="date"
                                name="date"
                                value={formValues.date}
                                onChange={handleChange}
                                min={getTodayDateString()}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Preferred time</span>
                            <input
                                type="time"
                                name="time"
                                value={formValues.time}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                            />
                        </label>
                    </div>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Additional details</span>
                        <textarea
                            name="notes"
                            value={formValues.notes || ''}
                            onChange={handleChange}
                            placeholder="Add any note or request for this appointment"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                            rows={3}
                        />
                    </label>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCheckAvailability}
                            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Check availability
                        </button>
                        <span className="text-sm text-slate-500">
                            {availabilityMessage || 'Confirm that your preferred slot is available before booking.'}
                        </span>
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
                            {isSubmitting ? 'Booking appointment...' : 'Confirm booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppointmentForm;
