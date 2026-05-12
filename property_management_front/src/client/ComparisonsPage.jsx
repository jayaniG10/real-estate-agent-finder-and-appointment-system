import { useEffect, useMemo, useState } from 'react';

const COMPARISONS_API_URL = 'http://localhost:8080/api/comparisons';
const PROPERTIES_API_URL = 'http://localhost:8080/api/properties';
const RATINGS_API_URL = 'http://localhost:8080/api/ratings';

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

const renderStars = (ratingValue) => {
    const rating = Math.max(0, Math.min(5, Math.round(ratingValue)));
    return '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating);
};

const getErrorMessage = (error, fallbackMessage) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
};

const COMPARISON_ROWS = [
    { label: 'Price', key: 'price', render: (property) => formatPrice(property.price) },
    { label: 'Location', key: 'location' },
    { label: 'Status', key: 'status' },
    {
        label: 'Average rating',
        key: 'averageRating',
        render: (property) => (property.reviewCount ? property.averageRating.toFixed(1) : 'N/A')
    },
    {
        label: 'Rating summary',
        key: 'ratingSummary',
        render: (property) => (property.reviewCount ? renderStars(property.averageRating) : 'No ratings')
    },
    {
        label: 'Reviews',
        key: 'reviewCount',
        render: (property) => `${property.reviewCount} review${property.reviewCount === 1 ? '' : 's'}`
    },
    {
        label: 'Selected on',
        key: 'comparedAt',
        render: (property) => formatDateTime(property.comparedAt)
    },
    {
        label: 'Created',
        key: 'createdAt',
        render: (property) => formatDateTime(property.createdAt)
    },
    {
        label: 'Overview',
        key: 'description',
        render: (property) => property.description || 'No description provided for this property.'
    }
];

const ComparisonsPage = ({ currentUser, onOpenPropertyDetails, onGoToProperties }) => {
    const [comparisons, setComparisons] = useState([]);
    const [properties, setProperties] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [removingComparisonId, setRemovingComparisonId] = useState(null);
    const [isClearing, setIsClearing] = useState(false);

    const loadComparisons = async () => {
        if (!currentUser?.id) {
            setComparisons([]);
            setProperties([]);
            setRatings([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            const [comparisonsResponse, propertiesResponse, ratingsResponse] = await Promise.all([
                fetch(`${COMPARISONS_API_URL}/user/${currentUser.id}`),
                fetch(PROPERTIES_API_URL),
                fetch(RATINGS_API_URL)
            ]);

            if (!comparisonsResponse.ok) {
                throw new Error('Unable to load comparisons.');
            }

            if (!propertiesResponse.ok) {
                throw new Error('Unable to load properties.');
            }

            if (!ratingsResponse.ok) {
                throw new Error('Unable to load ratings.');
            }

            const [comparisonsData, propertiesData, ratingsData] = await Promise.all([
                comparisonsResponse.json(),
                propertiesResponse.json(),
                ratingsResponse.json()
            ]);

            setComparisons(comparisonsData);
            setProperties(propertiesData);
            setRatings(ratingsData);
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to load comparison properties.'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadComparisons();
    }, [currentUser?.id]);

    const comparedProperties = useMemo(() => {
        const propertyMap = new Map(properties.map((property) => [property.id, property]));

        return comparisons
            .map((comparison) => {
                const property = propertyMap.get(comparison.propertyId);
                if (!property) {
                    return null;
                }

                const propertyRatings = ratings.filter((rating) => rating.propertyId === property.id);
                const averageRating = propertyRatings.length
                    ? propertyRatings.reduce((sum, rating) => sum + (rating.rating || 0), 0) / propertyRatings.length
                    : 0;

                return {
                    ...property,
                    comparisonId: comparison.id,
                    comparedAt: comparison.createdAt,
                    averageRating,
                    reviewCount: propertyRatings.length
                };
            })
            .filter(Boolean)
            .sort((firstProperty, secondProperty) => {
                return new Date(firstProperty.comparedAt).getTime() - new Date(secondProperty.comparedAt).getTime();
            });
    }, [comparisons, properties, ratings]);

    const handleRemoveComparison = async (comparisonId) => {
        setRemovingComparisonId(comparisonId);
        setErrorMessage('');

        try {
            const response = await fetch(`${COMPARISONS_API_URL}/${comparisonId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Unable to remove comparison property.');
            }

            setComparisons((currentComparisons) =>
                currentComparisons.filter((comparison) => comparison.id !== comparisonId)
            );
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to remove comparison property.'));
        } finally {
            setRemovingComparisonId(null);
        }
    };

    const handleClearComparisons = async () => {
        if (comparisons.length === 0) {
            return;
        }

        setIsClearing(true);
        setErrorMessage('');

        try {
            const results = await Promise.all(
                comparisons.map(async (comparison) => {
                    const response = await fetch(`${COMPARISONS_API_URL}/${comparison.id}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        throw new Error('Unable to clear comparisons.');
                    }

                    return comparison.id;
                })
            );

            setComparisons((currentComparisons) =>
                currentComparisons.filter((comparison) => !results.includes(comparison.id))
            );
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to clear comparisons.'));
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-300/40">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.28),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(234,179,8,0.16),_transparent_26%)] p-8 md:p-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                    Comparison Workspace
                                </span>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                    Compare selected properties
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
                                    Review up to 5 shortlisted properties side by side, spot pricing and rating
                                    differences, and open any property for the full detail view.
                                </p>
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-white/10 px-6 py-4 backdrop-blur-sm">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                                    Selected now
                                </p>
                                <p className="mt-3 text-3xl font-semibold text-white">{comparedProperties.length}/5</p>
                                <p className="mt-2 text-sm text-slate-300">Maximum 5 properties at a time</p>
                            </div>
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
                        Loading comparison properties...
                    </div>
                ) : comparedProperties.length === 0 ? (
                    <div className="rounded-[28px] bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200">
                        <h2 className="text-2xl font-semibold text-slate-900">No properties selected yet</h2>
                        <p className="mt-3 text-sm text-slate-500">
                            Open the properties page, enter selection mode, and choose the listings you want to
                            compare.
                        </p>
                        <button
                            type="button"
                            onClick={onGoToProperties}
                            className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Go to properties
                        </button>
                    </div>
                ) : (
                    <>
                        <section className="flex flex-col gap-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                    Ready to review
                                </p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                    {comparedProperties.length} shortlisted propert{comparedProperties.length === 1 ? 'y' : 'ies'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearComparisons}
                                disabled={isClearing}
                                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isClearing ? 'Clearing...' : 'Clear all'}
                            </button>
                        </section>

                        <section className="grid gap-6 xl:grid-cols-2">
                            {comparedProperties.map((property) => (
                                <article
                                    key={property.comparisonId}
                                    className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200"
                                >
                                    <div className="aspect-[16/9] bg-slate-200">
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
                                    <div className="space-y-5 p-6">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <h2 className="text-2xl font-semibold text-slate-900">{property.title}</h2>
                                                <p className="mt-2 text-sm text-slate-500">{property.location}</p>
                                            </div>
                                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                                {property.status}
                                            </span>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                    Price
                                                </p>
                                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                                    {formatPrice(property.price)}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl bg-amber-50 px-4 py-4">
                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                                                    Rating
                                                </p>
                                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                                    {property.reviewCount ? property.averageRating.toFixed(1) : 'N/A'}
                                                </p>
                                                <p className="mt-1 text-sm text-amber-800">
                                                    {property.reviewCount ? renderStars(property.averageRating) : 'No ratings'}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                    Reviews
                                                </p>
                                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                                    {property.reviewCount}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                            <button
                                                type="button"
                                                onClick={() => onOpenPropertyDetails?.(property.id)}
                                                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                            >
                                                View details
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveComparison(property.comparisonId)}
                                                disabled={removingComparisonId === property.comparisonId}
                                                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {removingComparisonId === property.comparisonId ? 'Removing...' : 'Remove'}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </section>

                        <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                            <div className="border-b border-slate-200 px-6 py-5">
                                <h2 className="text-xl font-semibold text-slate-900">Side-by-side comparison</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Scan each row to compare the shortlisted properties on the most important details.
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr>
                                            <th className="sticky left-0 z-10 bg-slate-50 px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                                Criteria
                                            </th>
                                            {comparedProperties.map((property) => (
                                                <th
                                                    key={property.comparisonId}
                                                    className="min-w-[240px] border-l border-slate-200 px-5 py-4 text-left text-sm font-semibold text-slate-900"
                                                >
                                                    {property.title}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {COMPARISON_ROWS.map((row, index) => (
                                            <tr key={row.key} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                                <td className="sticky left-0 z-10 border-t border-slate-200 bg-inherit px-5 py-4 align-top text-sm font-semibold text-slate-900">
                                                    {row.label}
                                                </td>
                                                {comparedProperties.map((property) => (
                                                    <td
                                                        key={`${row.key}-${property.comparisonId}`}
                                                        className="border-l border-t border-slate-200 px-5 py-4 align-top text-sm leading-7 text-slate-600"
                                                    >
                                                        {row.render ? row.render(property) : property[row.key]}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};

export default ComparisonsPage;
