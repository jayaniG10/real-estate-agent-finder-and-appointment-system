import { useEffect, useState } from 'react';

const PROPERTIES_API_URL = 'http://localhost:8080/api/properties';
const RATINGS_API_URL = 'http://localhost:8080/api/ratings';
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

const renderStars = (ratingValue) => {
    const rating = Math.max(0, Math.min(5, Math.round(ratingValue)));

    return '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating);
};

const PropertyDetails = ({ propertyId, onBack }) => {
    const [property, setProperty] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const loadPropertyDetails = async () => {
            setIsLoading(true);
            setErrorMessage('');

            try {
                const [propertyResponse, ratingsResponse, usersResponse] = await Promise.all([
                    fetch(`${PROPERTIES_API_URL}/${propertyId}`),
                    fetch(RATINGS_API_URL),
                    fetch(USERS_API_URL)
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

                const [propertyData, ratingsData, usersData] = await Promise.all([
                    propertyResponse.json(),
                    ratingsResponse.json(),
                    usersResponse.json()
                ]);

                setProperty(propertyData);
                setRatings(ratingsData.filter((rating) => rating.propertyId === propertyId));
                setUsers(usersData);
            } catch (error) {
                setErrorMessage(getErrorMessage(error, 'Unable to load property details.'));
            } finally {
                setIsLoading(false);
            }
        };

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
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.28),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(234,179,8,0.18),_transparent_26%)] p-8 md:p-10">
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
                                    Average rating
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

                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
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
                    </div>

                    <div className="space-y-6">
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
                                        Added by
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">
                                        {getUserNameById(property.addedBy)}
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
                        </section>

                        <section className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                            <h2 className="text-xl font-semibold text-slate-900">Ratings summary</h2>
                            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                                <div className="rounded-2xl bg-amber-50 px-4 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                                        Average
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                                        {ratings.length ? averageRating.toFixed(1) : 'N/A'}
                                    </p>
                                    <p className="mt-2 text-sm text-amber-800">
                                        {ratings.length ? renderStars(averageRating) : 'No ratings yet'}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Total reviews
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold text-slate-900">{ratings.length}</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </section>

                <section className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Ratings and reviews</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Admin view of all feedback submitted for this property.
                            </p>
                        </div>
                    </div>

                    {ratings.length === 0 ? (
                        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
                            No ratings or reviews available for this property yet.
                        </div>
                    ) : (
                        <div className="mt-8 space-y-4">
                            {ratings
                                .slice()
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((rating) => (
                                    <article
                                        key={rating.id}
                                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="text-base font-semibold text-slate-900">
                                                    {getUserNameById(rating.userId)}
                                                </p>
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
                                    </article>
                                ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default PropertyDetails;
