import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import CouncilPageShell from "@/components/CouncilPageShell";
import RepairCaseList from "@/components/RepairCaseList";
import { getAuthenticatedPrincipal } from "@/server/auth/session";
import { listRepairCases } from "@/server/repairs/service";

export const metadata: Metadata = { title: "My repairs" };

export default async function ResidentRepairsPage() {
    await connection();
    const principal = await getAuthenticatedPrincipal();

    if (!principal) {
        redirect("/login");
    }

    if (principal.role !== "RESIDENT") {
        redirect("/staff/repairs");
    }

    const cases = await listRepairCases(principal);

    return (
        <CouncilPageShell
            breadcrumbs={[
                { label: "Home", href: "/" },
                { label: "Housing", href: "/" },
                { label: "My repairs" },
            ]}
        >
            <section className="border-t-8 border-civic-accent bg-civic-surface px-5 py-8 outline outline-1 outline-civic-line sm:px-10 sm:py-11">
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-civic-accent-dark">
                    Resident account
                </p>
                <h1 className="civic-display mt-3 text-4xl text-civic-ink sm:text-5xl">
                    My repairs
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-civic-ink-soft">
                    Repairs submitted from your authenticated Westbridge account.
                </p>
                <RepairCaseList cases={cases} basePath="/repairs" />
            </section>
        </CouncilPageShell>
    );
}
