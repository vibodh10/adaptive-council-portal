"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
    repairStatusLabels,
} from "@/lib/housingRepairPresentation";
import {
    REPAIR_STATUSES,
    type RepairStatus,
} from "@/server/repairs/types";

export default function RepairStatusControl({
    caseId,
    currentStatus,
}: {
    caseId: string;
    currentStatus: RepairStatus;
}) {
    const router = useRouter();
    const [status, setStatus] = useState(currentStatus);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    return (
        <section
            aria-labelledby="workflow-status-heading"
            className="mt-8 border-l-8 border-civic-accent bg-civic-accent-soft px-5 py-6"
        >
            <h2 id="workflow-status-heading" className="text-lg font-black">
                Staff workflow status
            </h2>
            <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-end">
                <label className="font-bold">
                    Status
                    <select
                        value={status}
                        onChange={(event) =>
                            setStatus(event.target.value as RepairStatus)
                        }
                        className="civic-field mt-2 min-h-12 px-3 py-2.5"
                    >
                        {REPAIR_STATUSES.map((value) => (
                            <option key={value} value={value}>
                                {repairStatusLabels[value]}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    type="button"
                    disabled={isSaving || status === currentStatus}
                    onClick={async () => {
                        setError(null);
                        setIsSaving(true);
                        const response = await fetch(
                            `/api/staff/repairs/${caseId}/status`,
                            {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status }),
                            },
                        );
                        const result = (await response.json()) as {
                            error?: { message?: string };
                        };

                        if (!response.ok) {
                            setError(
                                result.error?.message ??
                                    "The status could not be updated.",
                            );
                        } else {
                            router.refresh();
                        }

                        setIsSaving(false);
                    }}
                    className="civic-button civic-button-primary min-h-12 px-5 py-3 disabled:opacity-50"
                >
                    {isSaving ? "Saving…" : "Update status"}
                </button>
            </div>
            {error && (
                <p role="alert" className="mt-4 font-bold text-civic-danger">
                    {error}
                </p>
            )}
        </section>
    );
}
