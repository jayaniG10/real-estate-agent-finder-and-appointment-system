import { useEffect, useMemo, useState } from 'react';

const PROPERTIES_API_URL = 'http://localhost:8080/api/properties';
const RATINGS_API_URL = 'http://localhost:8080/api/ratings';
const USERS_API_URL = 'http://localhost:8080/api/users';

const SORT_OPTIONS = [
    { value: 'highest-rated', label: 'Highest rated' },
    { value: 'lowest-rated', label: 'Lowest rated' },
    { value: 'most-reviewed', label: 'Most reviewed' },
    { value: 'least-reviewed', label: 'Least reviewed' },
    { value: 'newest', label: 'Newest properties' }
];

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

const RatingsManagementPage = () => {
    const [properties, setProperties] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [sortBy, setSortBy] = useState('highest-rated');
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);

    useEffect(() => {
        const loadPageData = async () => {
            setIsLoading(true);
            setErrorMessage('');

            try {
                const [propertiesResponse, ratingsResponse, usersResponse] = await Promise.all([
                    fetch(PROPERTIES_API_URL),
                    fetch(RATINGS_API_URL),
                    fetch(USERS_API_URL)
                ]);

                if (!propertiesResponse.ok) {
                    throw new Error('Unable to load properties.');
                }

                if (!ratingsResponse.ok) {
                    throw new Error('Unable to load ratings.');
                }

                if (!usersResponse.ok) {
                    throw new Error('Unable to load users.');
                }

                const [propertiesData, ratingsData, usersData] = await Promise.all([
                    propertiesResponse.json(),
                    ratingsResponse.json(),
                    usersResponse.json()
                ]);

                setProperties(propertiesData);
                setRatings(ratingsData);
                setUsers(usersData);
                setSelectedPropertyId((currentId) =>
                    currentId && propertiesData.some((property) => property.id === currentId)
                        ? currentId
                        : null
                );
            } catch (error) {
                setErrorMessage(getErrorMessage(error, 'Unable to load ratings data.'));
            } finally {
                setIsLoading(false);
            }
        };

        loadPageData();
    }, []);

    const getUserNameById = (userId) => {
        if (!userId) {
            return 'Unknown user';
        }

        return users.find((user) => user.id === userId)?.name ?? `User #${userId}`;
    };

    const propertyMetrics = useMemo(() => {
        return properties.map((property) => {
            const propertyRatings = ratings.filter((rating) => rating.propertyId === property.id);
            const averageRating = propertyRatings.length
                ? propertyRatings.reduce((sum, rating) => sum + (rating.rating || 0), 0) / propertyRatings.length
                : 0;

            return {
                ...property,
                averageRating,
                reviewCount: propertyRatings.length,
                ratings: propertyRatings
            };
        });
    }, [properties, ratings]);

    const sortedProperties = useMemo(() => {
        const sortableProperties = [...propertyMetrics];

        sortableProperties.sort((firstProperty, secondProperty) => {
            switch (sortBy) {
                case 'lowest-rated':
                    return (
                        firstProperty.averageRating - secondProperty.averageRating ||
                        firstProperty.reviewCount - secondProperty.reviewCount
                    );
                case 'most-reviewed':
                    return (
                        secondProperty.reviewCount - firstProperty.reviewCount ||
                        secondProperty.averageRating - firstProperty.averageRating
                    );
                case 'least-reviewed':
                    return (
                        firstProperty.reviewCount - secondProperty.reviewCount ||
                        secondProperty.averageRating - firstProperty.averageRating
                    );
                case 'newest':
                    return new Date(secondProperty.createdAt).getTime() - new Date(firstProperty.createdAt).getTime();
                case 'highest-rated':
                default:
                    return (
                        secondProperty.averageRating - firstProperty.averageRating ||
                        secondProperty.reviewCount - firstProperty.reviewCount
                    );
            }
        });

        return sortableProperties;
    }, [propertyMetrics, sortBy]);

    const selectedProperty =
        sortedProperties.find((property) => property.id === selectedPropertyId) ?? null;

    const totalReviews = ratings.length;
    const ratedProperties = propertyMetrics.filter((property) => property.reviewCount > 0).length;
    const platformAverage =
        totalReviews > 0
            ? ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0) / totalReviews
            : 0;

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-300/40">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.26),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.22),_transparent_30%)] p-8 md:p-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                    Admin Console
                                </span>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                    Ratings management
                                </h1>
                            </div>
                            <div className="w-full max-w-xs">
                                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                                    Sort properties
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(event) => setSortBy(event.target.value)}
                                    className="app-select-dark mt-3 w-full rounded-2xl px-4 py-3 text-sm font-medium text-white outline-none transition"
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value} className="text-slate-900">
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {errorMessage ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Total reviews</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{totalReviews}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Rated properties</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{ratedProperties}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Platform average</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">
                            {totalReviews ? platformAverage.toFixed(1) : 'N/A'}
                        </p>
                    </div>
                </section>

                <section>
                    <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <h2 className="text-lg font-semibold text-slate-900">Properties and ratings</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Click any row to open full property details and reviews.
                            </p>
                        </div>

                        {isLoading ? (
                            <div className="px-6 py-16 text-center text-sm text-slate-500">
                                Loading ratings...
                            </div>
                        ) : sortedProperties.length === 0 ? (
                            <div className="px-6 py-16 text-center text-sm text-slate-500">
                                No properties found.
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
                                                Location
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                                Average rating
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                                Reviews
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sortedProperties.map((property) => {
                                            const isSelected = selectedProperty?.id === property.id;

                                            return (
                                                <tr
                                                    key={property.id}
                                                    onClick={() => setSelectedPropertyId(property.id)}
                                                    className={`cursor-pointer transition ${
                                                        isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50/80'
                                                    }`}
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className={`font-medium ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                            {property.title}
                                                        </div>
                                                        <div className={`mt-1 text-sm ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                                            {formatPrice(property.price)}
                                                        </div>
                                                    </td>
                                                    <td className={`px-6 py-5 text-sm ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                                        {property.location}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className={`text-lg font-semibold ${isSelected ? 'text-amber-300' : 'text-slate-900'}`}>
                                                            {property.reviewCount ? property.averageRating.toFixed(1) : 'N/A'}
                                                        </div>
                                                        <div className={`mt-1 text-sm ${isSelected ? 'text-amber-200' : 'text-amber-700'}`}>
                                                            {property.reviewCount ? renderStars(property.averageRating) : 'No ratings'}
                                                        </div>
                                                    </td>
                                                    <td className={`px-6 py-5 text-sm ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                                        {property.reviewCount}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                                                                isSelected
                                                                    ? 'bg-white/15 text-white'
                                                                    : 'bg-slate-100 text-slate-700'
                                                            }`}
                                                        >
                                                            {property.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </section>
            </div>

            <div
                className={`fixed inset-0 z-50 transition ${
                    selectedProperty ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
            >
                <div
                    className={`absolute inset-0 bg-slate-950/35 transition-opacity duration-300 ${
                        selectedProperty ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={() => setSelectedPropertyId(null)}
                />

                <aside
                    className={`absolute right-0 top-0 flex h-screen w-full max-w-2xl transform flex-col bg-white shadow-2xl shadow-slate-950/20 transition-transform duration-300 ease-out ${
                        selectedProperty ? 'translate-x-0' : 'translate-x-full'
                    }`}
                >
                    {selectedProperty ? (
                        <>
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Property details
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Review the selected property and its feedback.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPropertyId(null)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto">
                                <div className="aspect-[16/10] bg-slate-200">
                                    {selectedProperty.image ? (
                                        <img
                                            src={selectedProperty.image}
                                            alt={selectedProperty.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#cbd5e1,#e2e8f0)] text-sm font-medium text-slate-500">
                                            No property image available
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6 p-6">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            Selected property
                                        </p>
                                        <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                                            {selectedProperty.title}
                                        </h2>
                                        <p className="mt-2 text-sm text-slate-500">{selectedProperty.location}</p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl bg-amber-50 px-4 py-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                                                Average rating
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold text-slate-900">
                                                {selectedProperty.reviewCount
                                                    ? selectedProperty.averageRating.toFixed(1)
                                                    : 'N/A'}
                                            </p>
                                            <p className="mt-2 text-sm text-amber-800">
                                                {selectedProperty.reviewCount
                                                    ? renderStars(selectedProperty.averageRating)
                                                    : 'No ratings yet'}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                Reviews
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold text-slate-900">
                                                {selectedProperty.reviewCount}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                Price
                                            </p>
                                            <p className="mt-2 text-lg font-semibold text-slate-900">
                                                {formatPrice(selectedProperty.price)}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                Created
                                            </p>
                                            <p className="mt-2 text-lg font-semibold text-slate-900">
                                                {formatDateTime(selectedProperty.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">Description</h3>
                                        <p className="mt-3 text-sm leading-7 text-slate-600">
                                            {selectedProperty.description || 'No description provided for this property.'}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">Reviews</h3>
                                        {selectedProperty.ratings.length === 0 ? (
                                            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                                                No ratings or reviews available for this property yet.
                                            </div>
                                        ) : (
                                            <div className="mt-4 space-y-4">
                                                {selectedProperty.ratings
                                                    .slice()
                                                    .sort(
                                                        (firstRating, secondRating) =>
                                                            new Date(secondRating.createdAt).getTime() -
                                                            new Date(firstRating.createdAt).getTime()
                                                    )
                                                    .map((rating) => (
                                                        <article
                                                            key={rating.id}
                                                            className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                                                        >
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div>
                                                                    <p className="font-semibold text-slate-900">
                                                                        {getUserNameById(rating.userId)}
                                                                    </p>
                                                                    <p className="mt-1 text-sm text-slate-500">
                                                                        {formatDateTime(rating.createdAt)}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
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
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </aside>
            </div>
        </div>
    );
};

export default RatingsManagementPage;
