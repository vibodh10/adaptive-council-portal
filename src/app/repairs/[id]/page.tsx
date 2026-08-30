import { redirect } from "next/navigation";
import { connection } from "next/server";

import CouncilPageShell from "@/components/CouncilPageShell";
import RepairCaseDetails from "@/components/RepairCaseDetails";
import { getAuthenticatedPrincipal } from "@/server/auth/session";
import { getRepairCase } from "@/server/repairs/service";

export default async function ResidentRepairDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await connection();
    const principal = await getAuthenticatedPrincipal();

    if (!principal) {
        redirect("/login");
    }

    if (principal.role !== "RESIDENT") {
        redirect("/staff/repairs");
    }

    const { id } = await params;
    const repairCase = await getRepairCase(principal, id);

    return (
        <CouncilPageShell
            breadcrumbs={[
                { label: "Home", href: "/" },
                { label: "My repairs", href: "/repairs" },
                { label: repairCase.reference },
            ]}
        >
            <article className="border-t-8 border-civic-accent bg-civic-surface px-5 py-8 outline outline-1 outline-civic-line sm:px-10 sm:py-11">
                <RepairCaseDetails repairCase={repairCase} />
            </article>
        </CouncilPageShell>
    );
}
