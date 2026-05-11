import { useEffect, useMemo, useState } from 'react';
import AppointmentForm from './components/AppointmentForm';
import InquiryForm from './components/InquiryForm';

const PROPERTIES_API_URL = 'http://localhost:8080/api/properties';
const RATINGS_API_URL = 'http://localhost:8080/api/ratings';
const USERS_API_URL = 'http://localhost:8080/api/users';
const APPOINTMENTS_API_URL = 'http://localhost:8080/api/appointments';
const INQUIRIES_API_URL = 'http://localhost:8080/api/inquiries';

const INITIAL_FORM_VALUES = {
    rating: '5',
    comment: ''
};

const RATING_LABELS = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very good',
    5: 'Excellent'
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

const renderStars = (ratingValue) => {
    const rating = Math.max(0, Math.min(5, Math.round(ratingValue)));

    return '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating);
};

const PropertyDetailsPage = ({ propertyId, onBack, currentUser }) => {
    const [property, setProperty] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [users, setUsers] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
    const [formError, setFormError] = useState('');
    const [editingRatingId, setEditingRatingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingRatingId, setDeletingRatingId] = useState(null);
    const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
    const [appointmentError, setAppointmentError] = useState('');
    const [isBookingAppointment, setIsBookingAppointment] = useState(false);
    const [isInquiryFormOpen, setIsInquiryFormOpen] = useState(false);
    const [inquiryError, setInquiryError] = useState('');
    const [isSendingInquiry, setIsSendingInquiry] = useState(false);
    const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

    const loadPropertyDetails = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const [propertyResponse, ratingsResponse, usersResponse, appointmentsResponse] = await Promise.all([
                fetch(`${PROPERTIES_API_URL}/${propertyId}`),
                fetch(RATINGS_API_URL),
                fetch(USERS_API_URL),
                fetch(APPOINTMENTS_API_URL)
            ]);

            if (!propertyResponse.ok) {
                throw new Error('Unable to load property details.');
            }

            if (!ratingsResponse.ok) {
                throw new Error('Unable to load property ratings.');
            }

            if (!usersResponse.ok) {
                throw new Error('Unable to load user information.');
            }

            if (!appointmentsResponse.ok) {
                throw new Error('Unable to load appointments.');
            }

            const [propertyData, ratingsData, usersData, appointmentsData] = await Promise.all([
                propertyResponse.json(),
                ratingsResponse.json(),
                usersResponse.json(),
                appointmentsResponse.json()
            ]);

            setProperty(propertyData);
            setRatings(ratingsData.filter((rating) => rating.propertyId === propertyId));
            setUsers(usersData);
            setAppointments(appointmentsData.filter((appointment) => appointment.propertyId === propertyId));
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to load property details.'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPropertyDetails();
    }, [propertyId]);

    const getUserNameById = (userId) => {
        if (!userId) {
            return 'Unknown user';
        }

        return users.find((user) => user.id === userId)?.name ?? `User #${userId}`;
    };

    const averageRating = ratings.length
        ? ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0) / ratings.length
        : 0;

    const sortedRatings = useMemo(() => {
        return [...ratings].sort(
            (firstRating, secondRating) =>
                new Date(secondRating.createdAt).getTime() - new Date(firstRating.createdAt).getTime()
        );
    }, [ratings]);

    const unavailableAppointmentDates = useMemo(() => {
        const blockedStatuses = new Set(['pending', 'confirmed', 'completed']);

        return appointments
            .filter((appointment) => blockedStatuses.has(appointment.status) && appointment.date)
            .map((appointment) => appointment.date);
    }, [appointments]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((currentValues) => ({
            ...currentValues,
            [name]: value
        }));
    };

    const handleSelectRating = (rating) => {
        setFormValues((currentValues) => ({
            ...currentValues,
            rating: String(rating)
        }));
    };

    const openNewReviewForm = () => {
        setEditingRatingId(null);
        setFormValues(INITIAL_FORM_VALUES);
        setFormError('');
        setIsReviewFormOpen(true);
    };

    const resetForm = () => {
        setFormValues(INITIAL_FORM_VALUES);
        setEditingRatingId(null);
        setFormError('');
        setIsReviewFormOpen(false);
    };

    const handleEditRating = (rating) => {
        setEditingRatingId(rating.id);
        setFormValues({
            rating: String(rating.rating ?? 5),
            comment: rating.comment ?? ''
        });
        setFormError('');
        setIsReviewFormOpen(true);
    };

    const handleSubmitRating = async (event) => {
        event.preventDefault();

        const numericRating = Number(formValues.rating);
        const normalizedComment = formValues.comment.trim();

        if (!currentUser?.id) {
            setFormError('You must be logged in to submit a review.');
            return;
        }

        if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            setFormError('Rating must be between 1 and 5.');
            return;
        }

        if (!normalizedComment) {
            setFormError('Review comment is required.');
            return;
        }

        setIsSubmitting(true);
        setFormError('');

        const isEditing = Boolean(editingRatingId);
        const existingRating = ratings.find((rating) => rating.id === editingRatingId);
        const endpoint = isEditing ? `${RATINGS_API_URL}/${editingRatingId}` : RATINGS_API_URL;
        const method = isEditing ? 'PUT' : 'POST';
        const payload = {
            id: existingRating?.id,
            userId: currentUser.id,
            propertyId,
            rating: numericRating,
            comment: normalizedComment,
            createdAt: existingRating?.createdAt ?? null
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
                throw new Error(isEditing ? 'Unable to update review.' : 'Unable to submit review.');
            }

            await loadPropertyDetails();
            resetForm();
        } catch (error) {
            setFormError(
                getErrorMessage(error, isEditing ? 'Unable to update review.' : 'Unable to submit review.')
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRating = async (ratingId) => {
        const confirmed = window.confirm('Delete this review?');
        if (!confirmed) {
            return;
        }

        setDeletingRatingId(ratingId);
        setFormError('');

        try {
            const response = await fetch(`${RATINGS_API_URL}/${ratingId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Unable to delete review.');
            }

            await loadPropertyDetails();

            if (editingRatingId === ratingId) {
                resetForm();
            }
        } catch (error) {
            setFormError(getErrorMessage(error, 'Unable to delete review.'));
        } finally {
            setDeletingRatingId(null);
        }
    };

    const handleBookAppointment = async (appointmentValues) => {
        if (!currentUser?.id) {
            setAppointmentError('You must be logged in to book an appointment.');
            return;
        }

        if (unavailableAppointmentDates.includes(appointmentValues.date)) {
            setAppointmentError('This date is already booked for this property. Please select another date.');
            return;
        }

        setIsBookingAppointment(true);
        setAppointmentError('');

        try {
            const response = await fetch(APPOINTMENTS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    propertyId,
                    date: appointmentValues.date,
                    time: appointmentValues.time,
                    status: 'pending'
                })
            });

            if (!response.ok) {
                throw new Error('Unable to book appointment.');
            }

            await loadPropertyDetails();
            setIsAppointmentFormOpen(false);
        } catch (error) {
            setAppointmentError(getErrorMessage(error, 'Unable to book appointment.'));
        } finally {
            setIsBookingAppointment(false);
        }
    };

    const handleSendInquiry = async (inquiryValues) => {
        if (!currentUser?.id) {
            setInquiryError('You must be logged in to send an inquiry.');
            return;
        }

        setIsSendingInquiry(true);
        setInquiryError('');

        try {
            const response = await fetch(INQUIRIES_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    propertyId,
                    question: inquiryValues.question,
                    answer: '',
                    status: 'pending'
                })
            });

            if (!response.ok) {
                throw new Error('Unable to send inquiry.');
            }

            setIsInquiryFormOpen(false);
        } catch (error) {
            setInquiryError(getErrorMessage(error, 'Unable to send inquiry.'));
        } finally {
            setIsSendingInquiry(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-100 p-6 md:p-8">
                <div className="mx-auto max-w-7xl rounded-[28px] bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    Loading property details...
                </div>
            </div>
        );
    }

    if (errorMessage || !property) {
        return (
            <div className="min-h-screen bg-slate-100 p-6 md:p-8">
                <div className="mx-auto max-w-7xl space-y-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        Back to properties
                    </button>
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage || 'Property not found.'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                    Back to properties
                </button>

                <section className="overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-300/40">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.28),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_28%)] p-8 md:p-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                    Property Details
                                </span>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                    {property.title}
                                </h1>
                                <p className="mt-3 text-sm text-slate-300 md:text-base">{property.location}</p>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/10 px-6 py-4 backdrop-blur-sm">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                                    Rating
                                </p>
                                <p className="mt-3 text-3xl font-semibold text-white">
                                    {ratings.length ? averageRating.toFixed(1) : 'N/A'}
                                </p>
                                <p className="mt-2 text-sm text-slate-300">
                                    {ratings.length} review{ratings.length === 1 ? '' : 's'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6">
                        <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                            <div className="aspect-[16/10] bg-slate-200">
                                {property.image ? (
                                    <img
                                        src={property.image}
                                        alt={property.title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#cbd5e1,#e2e8f0)] text-sm font-medium text-slate-500">
                                        No property image available
                                    </div>
                                )}
                            </div>
                            <div className="p-6 md:p-8">
                                <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
                                <p className="mt-4 text-sm leading-7 text-slate-600">
                                    {property.description || 'No description provided for this property.'}
                                </p>
                            </div>
                        </section>

                        <section className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
                            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Ratings and reviews</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Read community feedback and manage your own review.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={openNewReviewForm}
                                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Add review
                                </button>
                            </div>

                            {sortedRatings.length === 0 ? (
                                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
                                    No ratings or reviews available for this property yet.
                                </div>
                            ) : (
                                <div className="mt-6 space-y-4">
                                    {sortedRatings.map((rating) => {
                                        const isOwnRating = rating.userId === currentUser?.id;

                                        return (
                                            <article
                                                key={rating.id}
                                                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                                            >
                                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <p className="text-base font-semibold text-slate-900">
                                                                {getUserNameById(rating.userId)}
                                                            </p>
                                                            {isOwnRating ? (
                                                                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                                                                    Your review
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {formatDateTime(rating.createdAt)}
                                                        </p>
                                                    </div>
                                                    <div className="text-left md:text-right">
                                                        <p className="text-lg font-semibold text-amber-600">
                                                            {rating.rating ? rating.rating.toFixed(1) : 'N/A'}
                                                        </p>
                                                        <p className="mt-1 text-sm text-amber-700">
                                                            {renderStars(rating.rating || 0)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <p className="mt-4 text-sm leading-7 text-slate-600">
                                                    {rating.comment || 'No written review provided.'}
                                                </p>

                                                {isOwnRating ? (
                                                    <div className="mt-5 flex gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditRating(rating)}
                                                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteRating(rating.id)}
                                                            disabled={deletingRatingId === rating.id}
                                                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                                                        >
                                                            {deletingRatingId === rating.id ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>

                    <div>
                        <section className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                            <h2 className="text-xl font-semibold text-slate-900">Property information</h2>
                            <div className="mt-6 grid gap-4">
                                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Price
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">
                                        {formatPrice(property.price)}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Status
                                    </p>
                                    <p className="mt-2 text-lg font-semibold capitalize text-slate-900">
                                        {property.status}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Created
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">
                                        {formatDateTime(property.createdAt)}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 border-t border-slate-200 pt-6">
                                {appointmentError ? (
                                    <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {appointmentError}
                                    </div>
                                ) : null}
                                {inquiryError ? (
                                    <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {inquiryError}
                                    </div>
                                ) : null}
                                <div className="grid gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAppointmentFormOpen(true)}
                                        className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        Book appointment
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsInquiryFormOpen(true)}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        Add inquiry
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </section>
            </div>

            {isAppointmentFormOpen ? (
                <AppointmentForm
                    propertyTitle={property.title}
                    unavailableDates={unavailableAppointmentDates}
                    isSubmitting={isBookingAppointment}
                    onCancel={() => {
                        if (!isBookingAppointment) {
                            setIsAppointmentFormOpen(false);
                            setAppointmentError('');
                        }
                    }}
                    onSubmit={handleBookAppointment}
                />
            ) : null}

            {isInquiryFormOpen ? (
                <InquiryForm
                    propertyTitle={property.title}
                    isSubmitting={isSendingInquiry}
                    onCancel={() => {
                        if (!isSendingInquiry) {
                            setIsInquiryFormOpen(false);
                            setInquiryError('');
                        }
                    }}
                    onSubmit={handleSendInquiry}
                />
            ) : null}

            {isReviewFormOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200 md:p-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {editingRatingId ? 'Edit your review' : 'Add your review'}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Share your rating and written feedback for this property.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isSubmitting) {
                                        resetForm();
                                    }
                                }}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={handleSubmitRating} className="mt-6 space-y-5">
                            {formError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {formError}
                                </div>
                            ) : null}

                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-slate-700">Rating</span>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((rating) => {
                                            const isActive = rating <= Number(formValues.rating);

                                            return (
                                                <button
                                                    key={rating}
                                                    type="button"
                                                    onClick={() => handleSelectRating(rating)}
                                                    className={`text-3xl leading-none transition ${
                                                        isActive
                                                            ? 'text-amber-500'
                                                            : 'text-slate-300 hover:text-amber-300'
                                                    }`}
                                                    aria-label={`${rating} star${rating === 1 ? '' : 's'} - ${RATING_LABELS[rating]}`}
                                                >
                                                    ★
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="mt-3 text-sm font-medium text-slate-700">
                                        {formValues.rating} star{formValues.rating === '1' ? '' : 's'} -{' '}
                                        {RATING_LABELS[Number(formValues.rating)]}
                                    </p>
                                </div>
                            </label>

                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-slate-700">Review</span>
                                <textarea
                                    name="comment"
                                    rows="6"
                                    value={formValues.comment}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                    placeholder="Share your experience with this property"
                                />
                            </label>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                            >
                                {isSubmitting
                                    ? editingRatingId
                                        ? 'Saving review...'
                                        : 'Submitting review...'
                                    : editingRatingId
                                      ? 'Save changes'
                                      : 'Submit review'}
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default PropertyDetailsPage;
