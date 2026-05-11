import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

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

const FavoritePropertyCard = ({
    property,
    onOpenDetails,
    onRemoveFavorite,
    onSaveNote,
    maxNoteLength = 200,
    isRemoving = false,
    isSavingNote = false
}) => {
    const [noteValue, setNoteValue] = useState(property.notes ?? '');

    useEffect(() => {
        setNoteValue(property.notes ?? '');
    }, [property.notes, property.favoriteId]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSaveNote?.(property.favoriteId, noteValue);
    };

    return (
        <article className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col lg:flex-row">
                <div className="lg:w-[320px] lg:flex-none">
                    <div className="h-full min-h-[240px] bg-slate-200">
                        {property.image ? (
                            <img
                                src={property.image}
                                alt={property.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#cbd5e1,#e2e8f0)] px-6 text-center text-sm font-medium text-slate-500">
                                No property image available
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between p-6 md:p-7">
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                                        <Heart className="h-5 w-5" fill="currentColor" />
                                    </span>
                                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                        {property.status}
                                    </span>
                                </div>
                                <h2 className="mt-4 text-2xl font-semibold text-slate-900">{property.title}</h2>
                                <p className="mt-2 text-sm text-slate-500">{property.location}</p>
                                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                                    {property.description || 'No description provided for this property.'}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3 xl:w-[340px] xl:grid-cols-1">
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
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Your note</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Save reminders, pricing thoughts, or follow-up actions for this favorite.
                                </p>
                            </div>
                            <textarea
                                rows="4"
                                value={noteValue}
                                onChange={(event) => setNoteValue(event.target.value)}
                                maxLength={maxNoteLength}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                placeholder="Add a private note about this property"
                            />
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-500">
                                    {noteValue.length}/{maxNoteLength} characters
                                </p>
                                <button
                                    type="submit"
                                    disabled={isSavingNote}
                                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                                >
                                    {isSavingNote ? 'Saving note...' : 'Save note'}
                                </button>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => onRemoveFavorite?.(property.favoriteId)}
                                        disabled={isRemoving}
                                        className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isRemoving ? 'Removing...' : 'Remove favorite'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onOpenDetails?.(property.id)}
                                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        View more
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default FavoritePropertyCard;
