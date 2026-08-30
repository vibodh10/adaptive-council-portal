import Link from "next/link";
import type { ReactNode } from "react";

import {
    deliveryStatusLabels,
    formatCouncilDate,
    repairStatusLabels,
    repairTypeLabels,
} from "@/lib/housingRepairPresentation";
import type { RepairCaseDetail } from "@/server/repairs/types";

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-1 border-b border-civic-line-soft py-4 last:border-b-0 sm:grid-cols-[13rem_1fr] sm:gap-6">
            <dt className="font-bold text-civic-ink-soft">{label}</dt>
            <dd className="min-w-0 whitespace-pre-wrap font-medium text-civic-ink">
                {children}
            </dd>
        </div>
    );
}

export default function RepairCaseDetails({
    repairCase,
    staff = false,
    statusControl,
}: {
    repairCase: RepairCaseDetail;
    staff?: boolean;
    statusControl?: ReactNode;
}) {
    return (
        <>
            <header className="border-b border-civic-line pb-7">
                <p className="font-mono text-sm font-black tracking-wide text-civic-accent-dark">
                    {repairCase.reference}
                </p>
                <h1 className="civic-display mt-3 text-4xl text-civic-ink sm:text-5xl">
                    {repairCase.repairType
                        ? repairTypeLabels[repairCase.repairType]
                        : "Housing repair"}
                </h1>
                <div className="mt-5 flex flex-wrap gap-2">
                    <span className="bg-civic-mint-soft px-3 py-1 font-black text-civic-mint-strong">
                        {repairStatusLabels[repairCase.status]}
                    </span>
                    {staff && (
                        <span className="border border-civic-line px-3 py-1 font-bold text-civic-ink-soft">
                            {deliveryStatusLabels[repairCase.deliveryStatus]}
                        </span>
                    )}
                    {repairCase.immediateDanger && (
                        <span className="bg-civic-danger-soft px-3 py-1 font-black text-civic-danger">
                            Immediate danger reported
                        </span>
                    )}
                </div>
            </header>

            {statusControl}

            <section aria-labelledby="case-details-heading" className="mt-9">
                <h2
                    id="case-details-heading"
                    className="civic-display border-b-2 border-civic-ink pb-3 text-2xl sm:text-3xl"
                >
                    Repair details
                </h2>
                <dl>
                    {staff && repairCase.residentDisplayName && (
                        <DetailRow label="Resident">
                            {repairCase.residentDisplayName}
                        </DetailRow>
                    )}
                    <DetailRow label="Property address">
                        {repairCase.address}
                    </DetailRow>
                    <DetailRow label="Description">
                        {repairCase.issueDescription}
                    </DetailRow>
                    <DetailRow label="Problem started">
                        {formatCouncilDate(repairCase.whenProblemStarted)}
                    </DetailRow>
                    <DetailRow label="Getting worse">
                        {repairCase.isGettingWorse ? "Yes" : "No"}
                    </DetailRow>
                    <DetailRow label="Immediate danger">
                        {repairCase.immediateDanger ? "Yes" : "No"}
                    </DetailRow>
                    <DetailRow label="Access notes">
                        {repairCase.accessNotes || "None provided"}
                    </DetailRow>
                    <DetailRow label="Additional notes">
                        {repairCase.additionalNotes || "None provided"}
                    </DetailRow>
                    <DetailRow label="Submitted">
                        {formatCouncilDate(repairCase.createdAt)}
                    </DetailRow>
                </dl>
            </section>

            {repairCase.attachments.length > 0 && (
                <section aria-labelledby="case-attachments-heading" className="mt-9">
                    <h2
                        id="case-attachments-heading"
                        className="civic-display border-b-2 border-civic-ink pb-3 text-2xl sm:text-3xl"
                    >
                        Photographs
                    </h2>
                    <ul className="mt-4 space-y-3">
                        {repairCase.attachments.map((attachment) => (
                            <li key={attachment.id}>
                                <Link
                                    href={`/api/repairs/${repairCase.id}/attachments/${attachment.id}`}
                                    target="_blank"
                                    className="font-bold text-civic-accent-dark underline decoration-2 underline-offset-4"
                                >
                                    View {attachment.originalFilename}
                                    <span className="sr-only">
                                        {" "}(opens in a new tab)
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {staff && repairCase.deliveryAttempts && (
                <section aria-labelledby="delivery-history-heading" className="mt-9">
                    <h2
                        id="delivery-history-heading"
                        className="civic-display border-b-2 border-civic-ink pb-3 text-2xl sm:text-3xl"
                    >
                        Delivery history
                    </h2>
                    <ul className="mt-4 space-y-3">
                        {repairCase.deliveryAttempts.map((attempt) => (
                            <li
                                key={attempt.id}
                                className="border-l-4 border-civic-line bg-civic-paper px-4 py-3"
                            >
                                <span className="font-bold">
                                    Attempt {attempt.attemptNumber}: {attempt.status}
                                </span>{" "}
                                <span className="text-civic-ink-soft">
                                    via {attempt.adapterType.toLowerCase()} on{" "}
                                    {formatCouncilDate(attempt.createdAt)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {staff && repairCase.auditEvents && (
                <section aria-labelledby="audit-history-heading" className="mt-9">
                    <h2
                        id="audit-history-heading"
                        className="civic-display border-b-2 border-civic-ink pb-3 text-2xl sm:text-3xl"
                    >
                        Case activity
                    </h2>
                    <ol className="mt-4 space-y-3">
                        {repairCase.auditEvents.map((event) => (
                            <li key={event.id} className="text-civic-ink-soft">
                                <span className="font-bold text-civic-ink">
                                    {event.action.replaceAll("_", " ")}
                                </span>{" "}
                                — {formatCouncilDate(event.createdAt)}
                            </li>
                        ))}
                    </ol>
                </section>
            )}
        </>
    );
}
