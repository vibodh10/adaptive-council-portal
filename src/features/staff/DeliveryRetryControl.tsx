"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeliveryRetryControl({ caseId }: { caseId: string }) {
    const router = useRouter();
    const [isRetrying, setIsRetrying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="mt-5 border-l-8 border-civic-attention bg-civic-attention-soft px-5 py-5">
            <p className="font-black">Council delivery failed</p>
            <p className="mt-1 text-civic-ink-soft">
                The case remains safely stored in the Westbridge inbox. Retry
                only after checking the configured delivery endpoint.
            </p>
            <button
                type="button"
                disabled={isRetrying}
                onClick={async () => {
                    setError(null);
                    setIsRetrying(true);
                    const response = await fetch(
                        `/api/staff/repairs/${caseId}/retry-delivery`,
                        { method: "POST" },
                    );
                    const result = (await response.json()) as {
                        error?: { message?: string };
                    };

                    if (!response.ok) {
                        setError(
                            result.error?.message ??
                                "Delivery could not be retried.",
                        );
                    } else {
                        router.refresh();
                    }

                    setIsRetrying(false);
                }}
                className="civic-button civic-button-secondary mt-4 min-h-12 px-5 py-3 disabled:opacity-60"
            >
                {isRetrying ? "Retrying…" : "Retry council delivery"}
            </button>
            {error && (
                <p role="alert" className="mt-3 font-bold text-civic-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
