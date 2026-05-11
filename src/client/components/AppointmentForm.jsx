import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

const INITIAL_FORM_VALUES = {
    date: null,
    time: null
};

const AppointmentForm = ({ propertyTitle, unavailableDates = [], isSubmitting, onCancel, onSubmit }) => {
    const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
    const [errorMessage, setErrorMessage] = useState('');
    const currentDateTime = dayjs();
    const unavailableDateSet = new Set(unavailableDates);

    useEffect(() => {
        setFormValues(INITIAL_FORM_VALUES);
        setErrorMessage('');
    }, [propertyTitle, unavailableDates]);

    const handleDateChange = (value) => {
        setFormValues((currentValues) => ({
            ...currentValues,
            date: value,
            time: currentValues.date?.isSame(value, 'day') ? currentValues.time : null
        }));
    };

    const handleTimeChange = (value) => {
        setFormValues((currentValues) => ({
            ...currentValues,
            time: value
        }));
    };

    const minTime = formValues.date?.isSame(currentDateTime, 'day') ? currentDateTime : null;

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formValues.date || !formValues.time) {
            setErrorMessage('Date and time are required.');
            return;
        }

        if (unavailableDateSet.has(formValues.date.format('YYYY-MM-DD'))) {
            setErrorMessage('This date is already booked. Please choose another date.');
            return;
        }

        const appointmentDateTime = formValues.date
            .hour(formValues.time.hour())
            .minute(formValues.time.minute())
            .second(0)
            .millisecond(0);

        if (appointmentDateTime.isBefore(dayjs())) {
            setErrorMessage('Select a date and time from now onward.');
            return;
        }

        setErrorMessage('');
        await onSubmit({
            date: formValues.date.format('YYYY-MM-DD'),
            time: formValues.time.format('HH:mm'),
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
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
                        {errorMessage ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {errorMessage}
                            </div>
                        ) : null}

                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-slate-700">Preferred date</span>
                                <DatePicker
                                    value={formValues.date}
                                    onChange={handleDateChange}
                                    disablePast
                                    format="YYYY-MM-DD"
                                    shouldDisableDate={(date) => unavailableDateSet.has(date.format('YYYY-MM-DD'))}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small',
                                            helperText: unavailableDates.length
                                                ? 'Booked dates are unavailable.'
                                                : undefined
                                        }
                                    }}
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-slate-700">Preferred time</span>
                                <TimePicker
                                    value={formValues.time}
                                    onChange={handleTimeChange}
                                    minTime={minTime ?? undefined}
                                    disabled={!formValues.date}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small'
                                        }
                                    }}
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
                </LocalizationProvider>
            </div>
        </div>
    );
};

export default AppointmentForm;
