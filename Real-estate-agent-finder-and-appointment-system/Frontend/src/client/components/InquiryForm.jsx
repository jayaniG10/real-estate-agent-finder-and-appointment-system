import { useEffect, useState } from 'react';

const InquiryForm = ({ propertyTitle, initialQuestion = '', isSubmitting, onCancel, onSubmit }) => {
    const [question, setQuestion] = useState(initialQuestion);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        setQuestion(initialQuestion);
        setErrorMessage('');
    }, [initialQuestion, propertyTitle]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const normalizedQuestion = question.trim();
        if (!normalizedQuestion) {
            setErrorMessage('Question is required.');
            return;
        }

        setErrorMessage('');
        await onSubmit({ question: normalizedQuestion });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/15">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-2xl font-semibold text-slate-900">Send inquiry</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Ask a question about <span className="font-medium text-slate-700">{propertyTitle}</span>.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
                    {errorMessage ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errorMessage}
                        </div>
                    ) : null}

                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Your question</span>
                        <textarea
                            rows="6"
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                            placeholder="Ask about availability, features, pricing, or anything else"
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
                            {isSubmitting ? 'Sending inquiry...' : 'Send inquiry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InquiryForm;
