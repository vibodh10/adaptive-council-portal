import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import CouncilPageShell from "@/components/CouncilPageShell";
import RepairCaseList from "@/components/RepairCaseList";
import { getAuthenticatedPrincipal } from "@/server/auth/session";
import { listRepairCases } from "@/server/repairs/service";

export const metadata: Metadata = { title: "Staff repair inbox" };

export default async function StaffRepairsPage() {
    await connection();
    const principal = await getAuthenticatedPrincipal();

    if (!principal) {
        redirect("/login");
    }

    if (principal.role !== "STAFF") {
        redirect("/repairs");
    }

    const cases = await listRepairCases(principal);

    return (
        <CouncilPageShell
            breadcrumbs={[
                { label: "Home", href: "/" },
                { label: "Staff" },
                { label: "Repair inbox" },
            ]}
        >
            <section className="border-t-8 border-civic-accent bg-civic-surface px-5 py-8 outline outline-1 outline-civic-line sm:px-10 sm:py-11">
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-civic-accent-dark">
                    Authenticated council workspace
                </p>
                <h1 className="civic-display mt-3 text-4xl text-civic-ink sm:text-5xl">
                    Repair inbox
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-civic-ink-soft">
                    Westbridge repair cases only. Danger and delivery states are
                    shown for operational triage.
                </p>
                <RepairCaseList
                    cases={cases}
                    basePath="/staff/repairs"
                    showDelivery
                />
            </section>
        </CouncilPageShell>
    );
}
