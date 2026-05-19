import { useEffect, useState } from 'react';

const INQUIRIES_API_URL = 'http://localhost:8080/api/inquiries';
const USERS_API_URL = 'http://localhost:8080/api/users';
const PROPERTIES_API_URL = 'http://localhost:8080/api/properties';

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

const getErrorMessage = (error, fallbackMessage) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
};

const INITIAL_FORM_STATE = {
    question: '',
    answer: ''
};

const InquiryManagemantPage = () => {
    const [inquiries, setInquiries] = useState([]);
    const [users, setUsers] = useState([]);
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [formValues, setFormValues] = useState(INITIAL_FORM_STATE);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingInquiryId, setDeletingInquiryId] = useState(null);

    const loadPageData = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const [inquiriesResponse, usersResponse, propertiesResponse] = await Promise.all([
                fetch(INQUIRIES_API_URL),
                fetch(USERS_API_URL),
                fetch(PROPERTIES_API_URL)
            ]);

            if (!inquiriesResponse.ok) {
                throw new Error('Unable to load inquiries.');
            }

            if (!usersResponse.ok) {
                throw new Error('Unable to load users.');
            }

            if (!propertiesResponse.ok) {
                throw new Error('Unable to load properties.');
            }

            const [inquiriesData, usersData, propertiesData] = await Promise.all([
                inquiriesResponse.json(),
                usersResponse.json(),
                propertiesResponse.json()
            ]);

            setInquiries(inquiriesData);
            setUsers(usersData);
            setProperties(propertiesData);
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to load inquiry data.'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPageData();
    }, []);

    const getUserNameById = (userId) => {
        if (!userId) {
            return 'Unknown user';
        }

        return users.find((user) => user.id === userId)?.name ?? `User #${userId}`;
    };

    const getPropertyById = (propertyId) => {
        if (!propertyId) {
            return null;
        }

        return properties.find((property) => property.id === propertyId) ?? null;
    };

    const openInquiry = (inquiry) => {
        setSelectedInquiry(inquiry);
        setFormValues({
            question: inquiry.question ?? '',
            answer: inquiry.answer ?? ''
        });
        setFormError('');
    };

    const closeInquiry = () => {
        if (isSubmitting) {
            return;
        }

        setSelectedInquiry(null);
        setFormValues(INITIAL_FORM_STATE);
        setFormError('');
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((currentValues) => ({
            ...currentValues,
            [name]: value
        }));
    };

    const handleSaveInquiry = async (event) => {
        event.preventDefault();

        if (!selectedInquiry) {
            return;
        }

        const normalizedQuestion = formValues.question.trim();
        const normalizedAnswer = formValues.answer.trim();

        if (!normalizedQuestion) {
            setFormError('Question is required.');
            return;
        }

        setIsSubmitting(true);
        setFormError('');
        setErrorMessage('');

        const payload = {
            id: selectedInquiry.id,
            userId: selectedInquiry.userId,
            propertyId: selectedInquiry.propertyId,
            question: normalizedQuestion,
            answer: normalizedAnswer,
            status: normalizedAnswer ? 'replied' : 'pending',
            createdAt: selectedInquiry.createdAt
        };

        try {
            const response = await fetch(`${INQUIRIES_API_URL}/${selectedInquiry.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Unable to update inquiry.');
            }

            const updatedInquiry = await response.json();

            setInquiries((currentInquiries) =>
                currentInquiries.map((inquiry) =>
                    inquiry.id === updatedInquiry.id ? updatedInquiry : inquiry
                )
            );
            openInquiry(updatedInquiry);
        } catch (error) {
            setFormError(getErrorMessage(error, 'Unable to update inquiry.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteInquiry = async (inquiryId) => {
        const inquiry = inquiries.find((item) => item.id === inquiryId);
        const confirmed = window.confirm(
            `Delete inquiry from ${getUserNameById(inquiry?.userId)}?`
        );

        if (!confirmed) {
            return;
        }

        setDeletingInquiryId(inquiryId);
        setErrorMessage('');

        try {
            const response = await fetch(`${INQUIRIES_API_URL}/${inquiryId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Unable to delete inquiry.');
            }

            setInquiries((currentInquiries) =>
                currentInquiries.filter((inquiryItem) => inquiryItem.id !== inquiryId)
            );

            if (selectedInquiry?.id === inquiryId) {
                closeInquiry();
            }
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to delete inquiry.'));
        } finally {
            setDeletingInquiryId(null);
        }
    };

    const pendingCount = inquiries.filter((inquiry) => inquiry.status === 'pending').length;
    const repliedCount = inquiries.filter((inquiry) => inquiry.status === 'replied').length;

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-300/40">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.26),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.22),_transparent_30%)] p-8 md:p-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                    Admin Console
                                </span>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                    Inquiry management
                                </h1>
                            </div>
                            <button
                                type="button"
                                onClick={loadPageData}
                                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                            >
                                Refresh inquiries
                            </button>
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
                        <p className="text-sm font-medium text-slate-500">Total inquiries</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{inquiries.length}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Pending replies</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{pendingCount}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <p className="text-sm font-medium text-slate-500">Replied</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{repliedCount}</p>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                    <div className="border-b border-slate-200 px-6 py-5">
                        <h2 className="text-lg font-semibold text-slate-900">All inquiries</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Open any inquiry to review full context and manage the response.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="px-6 py-16 text-center text-sm text-slate-500">
                            Loading inquiries...
                        </div>
                    ) : inquiries.length === 0 ? (
                        <div className="px-6 py-16 text-center text-sm text-slate-500">
                            No inquiries found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Client
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Property
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Question
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Created
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {inquiries.map((inquiry) => {
                                        const property = getPropertyById(inquiry.propertyId);

                                        return (
                                            <tr
                                                key={inquiry.id}
                                                className="cursor-pointer transition hover:bg-slate-50/80"
                                                onClick={() => openInquiry(inquiry)}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="font-medium text-slate-900">
                                                        {getUserNameById(inquiry.userId)}
                                                    </div>
                                                    <div className="mt-1 text-sm text-slate-500">
                                                        User ID: {inquiry.userId}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="font-medium text-slate-900">
                                                        {property?.title ?? `Property #${inquiry.propertyId}`}
                                                    </div>
                                                    <div className="mt-1 text-sm text-slate-500">
                                                        {property?.location ?? 'Location unavailable'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="line-clamp-2 max-w-md text-sm text-slate-600">
                                                        {inquiry.question || 'No question provided.'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                                        {inquiry.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-500">
                                                    {formatDateTime(inquiry.createdAt)}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                openInquiry(inquiry);
                                                            }}
                                                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                                        >
                                                            Open
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleDeleteInquiry(inquiry.id);
                                                            }}
                                                            disabled={deletingInquiryId === inquiry.id}
                                                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                                                        >
                                                            {deletingInquiryId === inquiry.id ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {selectedInquiry ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/15">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">Inquiry details</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Review the client question and publish an admin response.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeInquiry}
                                disabled={isSubmitting}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                            <aside className="border-b border-slate-200 bg-slate-50 p-6 lg:border-b-0 lg:border-r">
                                <div className="space-y-4">
                                    <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            Client
                                        </p>
                                        <p className="mt-2 text-lg font-semibold text-slate-900">
                                            {getUserNameById(selectedInquiry.userId)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            Property
                                        </p>
                                        <p className="mt-2 text-lg font-semibold text-slate-900">
                                            {getPropertyById(selectedInquiry.propertyId)?.title ??
                                                `Property #${selectedInquiry.propertyId}`}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {getPropertyById(selectedInquiry.propertyId)?.location ??
                                                'Location unavailable'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            Submitted
                                        </p>
                                        <p className="mt-2 text-lg font-semibold text-slate-900">
                                            {formatDateTime(selectedInquiry.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </aside>

                            <form onSubmit={handleSaveInquiry} className="space-y-6 p-6">
                                {formError ? (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {formError}
                                    </div>
                                ) : null}

                                <label className="block space-y-2">
                                    <span className="text-sm font-medium text-slate-700">Question</span>
                                    <div className="min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900">
                                        {formValues.question || 'No question provided.'}
                                    </div>
                                </label>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Status
                                    </p>
                                    <p className="mt-2 text-sm font-medium uppercase tracking-[0.16em] text-slate-900">
                                        {formValues.answer.trim() ? 'replied' : 'pending'}
                                    </p>
                                </div>

                                <label className="block space-y-2">
                                    <span className="text-sm font-medium text-slate-700">Answer</span>
                                    <textarea
                                        name="answer"
                                        rows="6"
                                        value={formValues.answer}
                                        onChange={handleChange}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                        placeholder="Write the admin response"
                                    />
                                </label>

                                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                                        disabled={isSubmitting || deletingInquiryId === selectedInquiry.id}
                                        className="rounded-2xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {deletingInquiryId === selectedInquiry.id ? 'Deleting...' : 'Delete inquiry'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                                    >
                                        {isSubmitting ? 'Saving changes...' : 'Save changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default InquiryManagemantPage;
