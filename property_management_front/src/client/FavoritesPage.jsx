import { useEffect, useMemo, useState } from 'react';
import FavoritePropertyCard from './components/FavoritePropertyCard';

const FAVORITES_API_URL = 'http://localhost:8080/api/favorites';
const PROPERTIES_API_URL = 'http://localhost:8080/api/properties';
const RATINGS_API_URL = 'http://localhost:8080/api/ratings';

const SORT_OPTIONS = {
    recency: 'Most recent',
    rating: 'Highest rated'
};

const getErrorMessage = (error, fallbackMessage) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
};

const FavoritesPage = ({ currentUser, onOpenPropertyDetails }) => {
    const [favorites, setFavorites] = useState([]);
    const [properties, setProperties] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [sortBy, setSortBy] = useState('recency');
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [removingFavoriteId, setRemovingFavoriteId] = useState(null);
    const [savingFavoriteNoteId, setSavingFavoriteNoteId] = useState(null);

    const loadFavorites = async () => {
        if (!currentUser?.id) {
            setFavorites([]);
            setProperties([]);
            setRatings([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            const [favoritesResponse, propertiesResponse, ratingsResponse] = await Promise.all([
                fetch(FAVORITES_API_URL),
                fetch(PROPERTIES_API_URL),
                fetch(RATINGS_API_URL)
            ]);

            if (!favoritesResponse.ok) {
                throw new Error('Unable to load favorites.');
            }

            if (!propertiesResponse.ok) {
                throw new Error('Unable to load properties.');
            }

            if (!ratingsResponse.ok) {
                throw new Error('Unable to load ratings.');
            }

            const [favoritesData, propertiesData, ratingsData] = await Promise.all([
                favoritesResponse.json(),
                propertiesResponse.json(),
                ratingsResponse.json()
            ]);

            setFavorites(favoritesData.filter((favorite) => favorite.userId === currentUser.id));
            setProperties(propertiesData);
            setRatings(ratingsData);
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to load favorite properties.'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFavorites();
    }, [currentUser?.id]);

    const favoriteProperties = useMemo(() => {
        const propertyMap = new Map(properties.map((property) => [property.id, property]));

        return favorites
            .map((favorite) => {
                const property = propertyMap.get(favorite.propertyId);
                if (!property) {
                    return null;
                }

                const propertyRatings = ratings.filter((rating) => rating.propertyId === property.id);
                const averageRating = propertyRatings.length
                    ? propertyRatings.reduce((sum, rating) => sum + (rating.rating || 0), 0) / propertyRatings.length
                    : 0;

                return {
                    favoriteId: favorite.id,
                    favoritedAt: favorite.createdAt,
                    notes: favorite.notes ?? '',
                    ...property,
                    averageRating,
                    reviewCount: propertyRatings.length
                };
            })
            .filter(Boolean)
            .sort((firstProperty, secondProperty) => {
                if (sortBy === 'rating') {
                    return (
                        secondProperty.averageRating - firstProperty.averageRating ||
                        secondProperty.reviewCount - firstProperty.reviewCount ||
                        new Date(secondProperty.favoritedAt).getTime() - new Date(firstProperty.favoritedAt).getTime()
                    );
                }

                return new Date(secondProperty.favoritedAt).getTime() - new Date(firstProperty.favoritedAt).getTime();
            });
    }, [favorites, properties, ratings, sortBy]);

    const handleRemoveFavorite = async (favoriteId) => {
        setRemovingFavoriteId(favoriteId);
        setErrorMessage('');

        try {
            const response = await fetch(`${FAVORITES_API_URL}/${favoriteId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Unable to remove favorite.');
            }

            await loadFavorites();
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to remove favorite.'));
        } finally {
            setRemovingFavoriteId(null);
        }
    };

    const handleSaveFavoriteNote = async (favoriteId, notes) => {
        const favorite = favorites.find((favoriteItem) => favoriteItem.id === favoriteId);
        if (!favorite) {
            return;
        }

        setSavingFavoriteNoteId(favoriteId);
        setErrorMessage('');

        try {
            const response = await fetch(`${FAVORITES_API_URL}/${favoriteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...favorite,
                    notes: notes.trim()
                })
            });

            if (!response.ok) {
                throw new Error('Unable to save favorite note.');
            }

            const updatedFavorite = await response.json();
            setFavorites((currentFavorites) =>
                currentFavorites.map((favoriteItem) =>
                    favoriteItem.id === favoriteId ? updatedFavorite : favoriteItem
                )
            );
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to save favorite note.'));
        } finally {
            setSavingFavoriteNoteId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-300/40">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.26),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_28%)] p-8 md:p-10">
                        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                            <div className="max-w-3xl">
                                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                    Saved Shortlist
                                </span>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                    Favorite properties
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
                                    Review the places you saved, sort them by the newest additions or best ratings,
                                    and open any property for the full details page.
                                </p>
                            </div>

                            <label className="space-y-2">
                                <span className="block text-sm font-medium text-slate-200">Sort favorites by</span>
                                <select
                                    value={sortBy}
                                    onChange={(event) => setSortBy(event.target.value)}
                                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white outline-none transition focus:border-white/30"
                                >
                                    {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </label>
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
                        Loading favorites...
                    </div>
                ) : favoriteProperties.length === 0 ? (
                    <div className="rounded-[28px] bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                        No favorite properties saved yet.
                    </div>
                ) : (
                    <section className="space-y-6">
                        {favoriteProperties.map((property) => (
                            <FavoritePropertyCard
                                key={property.favoriteId}
                                property={property}
                                onOpenDetails={() => onOpenPropertyDetails?.(property.id)}
                                onRemoveFavorite={handleRemoveFavorite}
                                onSaveNote={handleSaveFavoriteNote}
                                isRemoving={removingFavoriteId === property.favoriteId}
                                isSavingNote={savingFavoriteNoteId === property.favoriteId}
                            />
                        ))}
                    </section>
                )}
            </div>
        </div>
    );
};

export default FavoritesPage;
