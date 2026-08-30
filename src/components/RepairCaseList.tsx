import Link from "next/link";

import {
    deliveryStatusLabels,
    formatCouncilDate,
    repairStatusLabels,
    repairTypeLabels,
} from "@/lib/housingRepairPresentation";
import type { RepairCaseSummary } from "@/server/repairs/types";

export default function RepairCaseList({
    cases,
    basePath,
    showDelivery = false,
}: {
    cases: RepairCaseSummary[];
    basePath: string;
    showDelivery?: boolean;
}) {
    if (cases.length === 0) {
        return (
            <div className="mt-7 border-l-8 border-civic-line bg-civic-paper px-5 py-6">
                <p className="font-bold text-civic-ink">No repairs to show.</p>
            </div>
        );
    }

    return (
        <ul className="mt-7 divide-y divide-civic-line border-y border-civic-line">
            {cases.map((repairCase) => (
                <li key={repairCase.id} className="py-5 sm:py-6">
                    <Link
                        href={`${basePath}/${repairCase.id}`}
                        className="group grid gap-4 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-civic-focus sm:grid-cols-[1fr_auto]"
                    >
                        <span>
                            <span className="block font-mono text-sm font-black tracking-wide text-civic-accent-dark group-hover:underline">
                                {repairCase.reference}
                            </span>
                            <span className="civic-display mt-2 block text-2xl text-civic-ink">
                                {repairCase.repairType
                                    ? repairTypeLabels[repairCase.repairType]
                                    : "Housing repair"}
                            </span>
                            <span className="mt-1 block text-civic-ink-soft">
                                {repairCase.address}
                            </span>
                        </span>
                        <span className="flex flex-wrap items-start gap-2 sm:max-w-64 sm:justify-end">
                            {repairCase.immediateDanger && (
                                <span className="bg-civic-danger-soft px-3 py-1 text-sm font-black text-civic-danger">
                                    Danger reported
                                </span>
                            )}
                            <span className="bg-civic-mint-soft px-3 py-1 text-sm font-black text-civic-mint-strong">
                                {repairStatusLabels[repairCase.status]}
                            </span>
                            {showDelivery && (
                                <span className="border border-civic-line px-3 py-1 text-sm font-bold text-civic-ink-soft">
                                    {deliveryStatusLabels[
                                        repairCase.deliveryStatus
                                    ]}
                                </span>
                            )}
                            <span className="w-full text-sm text-civic-ink-soft sm:text-right">
                                {formatCouncilDate(repairCase.createdAt)}
                            </span>
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
