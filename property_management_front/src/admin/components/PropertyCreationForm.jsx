import { useEffect, useState } from 'react';

const INITIAL_FORM_VALUES = {
    title: '',
    price: '',
    location: '',
    description: '',
    image: '',
    status: 'available'
};

const PropertyCreationForm = ({ property, currentUser, isSubmitting, onCancel, onSubmit }) => {
    const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (property) {
            setFormValues({
                title: property.title ?? '',
                price: property.price ?? '',
                location: property.location ?? '',
                description: property.description ?? '',
                image: property.image ?? '',
                status: property.status ?? 'available'
            });
            return;
        }

        setFormValues(INITIAL_FORM_VALUES);
    }, [property]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((currentValues) => ({
            ...currentValues,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const normalizedValues = {
            title: formValues.title.trim(),
            price: formValues.price,
            location: formValues.location.trim(),
            description: formValues.description.trim(),
            image: formValues.image.trim(),
            addedBy: currentUser?.id ?? property?.addedBy ?? null,
            status: formValues.status
        };

        if (!normalizedValues.title || !normalizedValues.location || !normalizedValues.price) {
            setErrorMessage('Title, price, and location are required.');
            return;
        }

        if (Number.isNaN(Number(normalizedValues.price)) || Number(normalizedValues.price) < 0) {
            setErrorMessage('Price must be a valid positive number.');
            return;
        }

        if (!normalizedValues.addedBy) {
            setErrorMessage('Unable to determine the logged-in user for this property.');
            return;
        }

        setErrorMessage('');
        await onSubmit(normalizedValues);
    };

    const isEditing = Boolean(property?.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/15">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-2xl font-semibold text-slate-900">
                        {isEditing ? 'Edit property' : 'Create property'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {isEditing
                            ? 'Update listing details, assignment, and availability.'
                            : 'Create a new listing and assign the responsible user.'}
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
                            <span className="text-sm font-medium text-slate-700">Property title</span>
                            <input
                                type="text"
                                name="title"
                                value={formValues.title}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                placeholder="Enter property title"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Location</span>
                            <input
                                type="text"
                                name="location"
                                value={formValues.location}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                placeholder="Enter property location"
                            />
                        </label>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Price</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                name="price"
                                value={formValues.price}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                placeholder="Enter price"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Status</span>
                            <select
                                name="status"
                                value={formValues.status}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                            >
                                <option value="available">Available</option>
                                <option value="sold">Sold</option>
                                <option value="rented">Rented</option>
                            </select>
                        </label>

                        <div className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Added by</span>
                            <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700">
                                {currentUser ? `${currentUser.name} (${currentUser.email})` : 'Logged user unavailable'}
                            </div>
                        </div>
                    </div>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Image URL</span>
                        <input
                            type="text"
                            name="image"
                            value={formValues.image}
                            onChange={handleChange}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                            placeholder="Enter image URL"
                        />
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Description</span>
                        <textarea
                            name="description"
                            rows="5"
                            value={formValues.description}
                            onChange={handleChange}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                            placeholder="Enter property description"
                        />
                    </label>

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
                            {isSubmitting
                                ? isEditing
                                    ? 'Saving changes...'
                                    : 'Creating property...'
                                : isEditing
                                  ? 'Save changes'
                                  : 'Create property'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PropertyCreationForm;
