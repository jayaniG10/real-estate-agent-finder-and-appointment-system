import { useEffect, useState } from 'react';

const INITIAL_FORM_VALUES = {
    date: '',
    time: ''
};

const AppointmentForm = ({ propertyTitle, isSubmitting, onCancel, onSubmit }) => {
    const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        setFormValues(INITIAL_FORM_VALUES);
        setErrorMessage('');
    }, [propertyTitle]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((currentValues) => ({
            ...currentValues,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formValues.date || !formValues.time) {
            setErrorMessage('Date and time are required.');
            return;
        }

        setErrorMessage('');
        await onSubmit({
            date: formValues.date,
            time: formValues.time,
            status: 'pending'
        });
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
