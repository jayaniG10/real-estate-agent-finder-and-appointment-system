import { useEffect, useMemo, useState } from 'react';
import PropertyCard from './components/PropertyCard';

const PROPERTIES_API_URL = 'http://localhost:8080/api/properties';
const RATINGS_API_URL = 'http://localhost:8080/api/ratings';
const FAVORITES_API_URL = 'http://localhost:8080/api/favorites';
const COMPARISONS_API_URL = 'http://localhost:8080/api/comparisons';
const MAX_COMPARISON_PROPERTIES = 5;

const getErrorMessage = (error, fallbackMessage) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
};

const PropertiesPage = ({ onOpenPropertyDetails, onOpenComparisons, currentUser }) => {
    const [properties, setProperties] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [comparisons, setComparisons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [favoriteErrorMessage, setFavoriteErrorMessage] = useState('');
    const [pendingFavoritePropertyId, setPendingFavoritePropertyId] = useState(null);
    const [favoriteToastMessage, setFavoriteToastMessage] = useState('');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [pendingComparisonPropertyId, setPendingComparisonPropertyId] = useState(null);

    const loadFavorites = async () => {
        if (!currentUser?.id) {
            setFavorites([]);
            return;
        }

        const response = await fetch(FAVORITES_API_URL);
        if (!response.ok) {
            throw new Error('Unable to load favorites.');
        }

        const favoritesData = await response.json();
        setFavorites(favoritesData.filter((favorite) => favorite.userId === currentUser.id));
    };

    const loadComparisons = async () => {
        if (!currentUser?.id) {
            setComparisons([]);
            return;
        }

        const response = await fetch(`${COMPARISONS_API_URL}/user/${currentUser.id}`);
        if (!response.ok) {
            throw new Error('Unable to load comparisons.');
        }

        const comparisonsData = await response.json();
        setComparisons(comparisonsData);
    };

    useEffect(() => {
        const loadProperties = async () => {
            setIsLoading(true);
            setErrorMessage('');

            try {
                const requests = [fetch(PROPERTIES_API_URL), fetch(RATINGS_API_URL)];

                if (currentUser?.id) {
                    requests.push(fetch(FAVORITES_API_URL));
                    requests.push(fetch(`${COMPARISONS_API_URL}/user/${currentUser.id}`));
                }

                const [propertiesResponse, ratingsResponse, favoritesResponse, comparisonsResponse] = await Promise.all(
                    requests
                );

                if (!propertiesResponse.ok) {
                    throw new Error('Unable to load properties.');
                }

                if (!ratingsResponse.ok) {
                    throw new Error('Unable to load ratings.');
                }

                const [propertiesData, ratingsData] = await Promise.all([
                    propertiesResponse.json(),
                    ratingsResponse.json()
                ]);

                setProperties(propertiesData);
                setRatings(ratingsData);

                if (favoritesResponse) {
                    if (!favoritesResponse.ok) {
                        throw new Error('Unable to load favorites.');
                    }

                    const favoritesData = await favoritesResponse.json();
                    setFavorites(favoritesData.filter((favorite) => favorite.userId === currentUser.id));
                } else {
                    setFavorites([]);
                }

                if (comparisonsResponse) {
                    if (!comparisonsResponse.ok) {
                        throw new Error('Unable to load comparisons.');
                    }

                    const comparisonsData = await comparisonsResponse.json();
                    setComparisons(comparisonsData);
                } else {
                    setComparisons([]);
                }
            } catch (error) {
                setErrorMessage(getErrorMessage(error, 'Unable to load property listings.'));
            } finally {
                setIsLoading(false);
            }
        };

        loadProperties();
    }, [currentUser?.id]);

    useEffect(() => {
        if (!favoriteToastMessage) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            setFavoriteToastMessage('');
        }, 2600);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [favoriteToastMessage]);

    const favoritePropertyIds = useMemo(() => {
        return new Set(favorites.map((favorite) => favorite.propertyId));
    }, [favorites]);

    const comparisonPropertyIds = useMemo(() => {
        return new Set(comparisons.map((comparison) => comparison.propertyId));
    }, [comparisons]);

    const propertyCards = useMemo(() => {
        return properties
            .map((property) => {
                const propertyRatings = ratings.filter((rating) => rating.propertyId === property.id);
                const averageRating = propertyRatings.length
                    ? propertyRatings.reduce((sum, rating) => sum + (rating.rating || 0), 0) / propertyRatings.length
                    : 0;

                return {
                    ...property,
                    averageRating,
                    reviewCount: propertyRatings.length
                };
            })
            .sort((firstProperty, secondProperty) => {
                return (
                    secondProperty.averageRating - firstProperty.averageRating ||
                    secondProperty.reviewCount - firstProperty.reviewCount
                );
            });
    }, [properties, ratings]);

    const handleToggleFavorite = async (propertyId) => {
        if (!currentUser?.id) {
            setFavoriteErrorMessage('You must be logged in to manage favorites.');
            return;
        }

        setPendingFavoritePropertyId(propertyId);
        setFavoriteErrorMessage('');

        const existingFavorite = favorites.find((favorite) => favorite.propertyId === propertyId);

        try {
            const response = await fetch(
                existingFavorite ? `${FAVORITES_API_URL}/${existingFavorite.id}` : FAVORITES_API_URL,
                existingFavorite
                    ? { method: 'DELETE' }
                    : {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                              userId: currentUser.id,
                              propertyId,
                              notes: ''
                          })
                      }
            );

            if (!response.ok) {
                throw new Error(existingFavorite ? 'Unable to remove favorite.' : 'Unable to save favorite.');
            }

            await loadFavorites();
            setFavoriteToastMessage(
                existingFavorite ? 'Property removed from favorites.' : 'Property added to favorites.'
            );
        } catch (error) {
            setFavoriteErrorMessage(
                getErrorMessage(
                    error,
                    existingFavorite ? 'Unable to remove favorite.' : 'Unable to save favorite.'
                )
            );
        } finally {
            setPendingFavoritePropertyId(null);
        }
    };

    const handleToggleComparison = async (propertyId) => {
        if (!currentUser?.id) {
            setFavoriteErrorMessage('You must be logged in to compare properties.');
            return;
        }

        setPendingComparisonPropertyId(propertyId);
        setFavoriteErrorMessage('');

        const existingComparison = comparisons.find((comparison) => comparison.propertyId === propertyId);

        if (!existingComparison && comparisons.length >= MAX_COMPARISON_PROPERTIES) {
            setPendingComparisonPropertyId(null);
            setFavoriteErrorMessage('You can compare up to 5 properties at a time.');
            setFavoriteToastMessage('Comparison limit reached. Remove one property before adding another.');
            return;
        }

        try {
            const response = await fetch(
                existingComparison
                    ? `${COMPARISONS_API_URL}/${existingComparison.id}`
                    : COMPARISONS_API_URL,
                existingComparison
                    ? { method: 'DELETE' }
                    : {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                              userId: currentUser.id,
                              propertyId
                          })
                      }
            );

            if (!response.ok) {
                throw new Error(
                    existingComparison ? 'Unable to remove property from comparisons.' : 'Unable to add property to comparisons.'
                );
            }

            await loadComparisons();
            setFavoriteToastMessage(
                existingComparison
                    ? 'Property removed from comparisons.'
                    : 'Property added to comparisons.'
            );
        } catch (error) {
            setFavoriteErrorMessage(
                getErrorMessage(
                    error,
                    existingComparison
                        ? 'Unable to remove property from comparisons.'
                        : 'Unable to add property to comparisons.'
                )
            );
        } finally {
            setPendingComparisonPropertyId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-8">
            {favoriteToastMessage ? (
                <div className="pointer-events-none fixed right-6 top-6 z-50">
                    <div className="min-w-[280px] rounded-3xl border border-emerald-200 bg-white/95 px-5 py-4 text-sm text-slate-700 shadow-2xl shadow-emerald-100/70 backdrop-blur">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                ♥
                            </span>
                            <div>
                                <p className="font-semibold text-slate-900">Favorites updated</p>
                                <p className="mt-1 text-slate-600">{favoriteToastMessage}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-300/40">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.26),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.2),_transparent_28%)] p-8 md:p-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                    Client Listings
                                </span>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                    Browse available properties
                                </h1>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setIsSelectionMode((currentMode) => !currentMode)}
                                    className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                                        isSelectionMode
                                            ? 'bg-white text-slate-950 hover:bg-slate-100'
                                            : 'border border-white/15 bg-white/10 text-white hover:bg-white/15'
                                    }`}
                                >
                                    {isSelectionMode ? 'Exit selection mode' : 'Select properties'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {isSelectionMode ? (
                    <section className="rounded-[28px] border border-emerald-200 bg-white p-5 shadow-sm ring-1 ring-emerald-100">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                                    Selection Mode
                                </p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                                    {comparisons.length} of {MAX_COMPARISON_PROPERTIES} properties selected
                                </h2>
                                <p className="mt-2 text-sm text-slate-600">
                                    Click any property card to add or remove it from your comparison list, then open
                                    the comparisons page when you are ready.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => onOpenComparisons?.()}
                                disabled={comparisons.length === 0}
                                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                            >
                                Compare selected properties
                            </button>
                        </div>
                    </section>
                ) : null}

                {errorMessage ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                {favoriteErrorMessage ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {favoriteErrorMessage}
                    </div>
                ) : null}

                {isLoading ? (
                    <div className="rounded-[28px] bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                        Loading properties...
                    </div>
                ) : propertyCards.length === 0 ? (
                    <div className="rounded-[28px] bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                        No properties available right now.
                    </div>
                ) : (
                    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {propertyCards.map((property) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                onClick={() =>
                                    isSelectionMode
                                        ? handleToggleComparison(property.id)
                                        : onOpenPropertyDetails?.(property.id)
                                }
                                isFavorite={favoritePropertyIds.has(property.id)}
                                isFavoritePending={pendingFavoritePropertyId === property.id}
                                onToggleFavorite={() => handleToggleFavorite(property.id)}
                                isSelectionMode={isSelectionMode}
                                isSelected={comparisonPropertyIds.has(property.id)}
                                isSelectionPending={pendingComparisonPropertyId === property.id}
                                onToggleSelection={() => handleToggleComparison(property.id)}
                            />
                        ))}
                    </section>
                )}
            </div>
        </div>
    );
};

export default PropertiesPage;
