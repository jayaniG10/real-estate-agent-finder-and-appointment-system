import { useEffect, useState } from 'react';
import InquiryForm from './components/InquiryForm';

const INQUIRIES_API_URL = 'http://localhost:8080/api/inquiries';
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

const InquiriesPage = ({ currentUser }) => {
    const [inquiries, setInquiries] = useState([]);
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [editingInquiry, setEditingInquiry] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadInquiries = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const [inquiriesResponse, propertiesResponse] = await Promise.all([
                fetch(INQUIRIES_API_URL),
                fetch(PROPERTIES_API_URL)
            ]);

            if (!inquiriesResponse.ok) {
                throw new Error('Unable to load inquiries.');
            }

            if (!propertiesResponse.ok) {
                throw new Error('Unable to load properties.');
            }

            const [inquiriesData, propertiesData] = await Promise.all([
                inquiriesResponse.json(),
                propertiesResponse.json()
            ]);

            setInquiries(inquiriesData.filter((inquiry) => inquiry.userId === currentUser?.id));
            setProperties(propertiesData);
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to load inquiries.'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.id) {
            loadInquiries();
        }
    }, [currentUser?.id]);

    const getPropertyById = (propertyId) => {
        return properties.find((property) => property.id === propertyId) ?? null;
    };

    const handleEditInquiry = (inquiry) => {
        if (inquiry.answer?.trim()) {
            return;
        }

        setEditingInquiry(inquiry);
    };

    const handleSubmitEdit = async ({ question }) => {
        if (!editingInquiry) {
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const response = await fetch(`${INQUIRIES_API_URL}/${editingInquiry.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...editingInquiry,
                    question
                })
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
            setEditingInquiry(null);
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to update inquiry.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-300/40">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.26),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_28%)] p-8 md:p-10">
                        <div className="max-w-3xl">
                            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                                Client Inquiries
                            </span>
                            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                Your inquiries
                            </h1>
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
                        Loading inquiries...
                    </div>
                ) : inquiries.length === 0 ? (
                    <div className="rounded-[28px] bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                        You have not submitted any inquiries yet.
                    </div>
                ) : (
                    <section className="space-y-4">
                        {inquiries
                            .slice()
                            .sort(
                                (firstInquiry, secondInquiry) =>
                                    new Date(secondInquiry.createdAt).getTime() -
                                    new Date(firstInquiry.createdAt).getTime()
                            )
                            .map((inquiry) => {
                                const property = getPropertyById(inquiry.propertyId);
                                const isAnswered = Boolean(inquiry.answer?.trim());

                                return (
                                    <article
                                        key={inquiry.id}
                                        className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                    Property
                                                </p>
                                                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                                                    {property?.title ?? `Property #${inquiry.propertyId}`}
                                                </h2>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {property?.location ?? 'Location unavailable'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                                    {inquiry.status}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditInquiry(inquiry)}
                                                    disabled={isAnswered}
                                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                                            <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                    Your inquiry
                                                </p>
                                                <p className="mt-3 text-sm leading-7 text-slate-700">
                                                    {inquiry.question}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                    Answer
                                                </p>
                                                <p className="mt-3 text-sm leading-7 text-slate-700">
                                                    {isAnswered ? inquiry.answer : 'No reply yet.'}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-4 text-sm text-slate-500">
                                            Submitted: {formatDateTime(inquiry.createdAt)}
                                        </p>
                                    </article>
                                );
                            })}
                    </section>
                )}
            </div>

            {editingInquiry ? (
                <InquiryForm
                    propertyTitle={getPropertyById(editingInquiry.propertyId)?.title ?? 'Selected property'}
                    initialQuestion={editingInquiry.question}
                    isSubmitting={isSubmitting}
                    onCancel={() => {
                        if (!isSubmitting) {
                            setEditingInquiry(null);
                        }
                    }}
                    onSubmit={handleSubmitEdit}
                />
            ) : null}
        </div>
    );
};

export default InquiriesPage;
