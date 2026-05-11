import { Heart } from 'lucide-react';

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

const PropertyCard = ({
    property,
    onClick,
    isFavorite = false,
    onToggleFavorite,
    isFavoritePending = false,
    isSelectionMode = false,
    isSelected = false,
    onToggleSelection,
    isSelectionPending = false
}) => {
    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick?.();
        }
    };

    const handleFavoriteClick = (event) => {
        event.stopPropagation();
        onToggleFavorite?.();
    };

    const handleSelectionClick = (event) => {
        event.stopPropagation();
        onToggleSelection?.();
    };

    return (
        <article
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            className={`group overflow-hidden rounded-[28px] bg-white text-left shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                isSelected
                    ? 'ring-emerald-300 shadow-xl shadow-emerald-100/70'
                    : 'ring-slate-200 hover:ring-slate-300'
            }`}
        >
            <div className="aspect-[4/3] overflow-hidden bg-slate-200">
                {property.image ? (
                    <img
                        src={property.image}
                        alt={property.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#cbd5e1,#e2e8f0)] text-sm font-medium text-slate-500">
                        No property image available
                    </div>
                )}
            </div>

            <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="truncate text-xl font-semibold text-slate-900">{property.title}</h2>
                        <p className="mt-1 text-sm text-slate-500">{property.location}</p>
                    </div>
                    <div className="flex items-start gap-2">
                        {isSelectionMode ? (
                            <button
                                type="button"
                                onClick={handleSelectionClick}
                                disabled={isSelectionPending}
                                className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                                    isSelected
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-900 text-white hover:bg-slate-700'
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                                {isSelectionPending ? 'Saving' : isSelected ? 'Selected' : 'Select'}
                            </button>
                        ) : null}
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                            {property.status}
                        </span>
                        {onToggleFavorite ? (
                            <button
                                type="button"
                                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                aria-pressed={isFavorite}
                                onClick={handleFavoriteClick}
                                disabled={isFavoritePending}
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                                    isFavorite
                                        ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                                <Heart className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} />
                            </button>
                        ) : null}
                    </div>
                </div>

                <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                    {property.description || 'No description provided for this property.'}
                </p>

                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Price</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{formatPrice(property.price)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-slate-500">Rating</p>
                        <p className="mt-1 text-lg font-semibold text-amber-600">
                            {property.reviewCount ? property.averageRating.toFixed(1) : 'N/A'}
                        </p>
                        <p className="mt-1 text-sm text-amber-700">
                            {property.reviewCount ? renderStars(property.averageRating) : 'No ratings'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {property.reviewCount} review{property.reviewCount === 1 ? '' : 's'}
                        </p>
                    </div>
                </div>

                {isSelectionMode ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {isSelected
                            ? 'Selected for comparison. Open the comparisons page when you are ready.'
                            : 'Click the card or the select button to add this property to your comparison list.'}
                    </div>
                ) : null}
            </div>
        </article>
    );
};

export default PropertyCard;
