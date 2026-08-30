import { redirect } from "next/navigation";
import { connection } from "next/server";

import CouncilPageShell from "@/components/CouncilPageShell";
import RepairCaseDetails from "@/components/RepairCaseDetails";
import RepairStatusControl from "@/features/staff/RepairStatusControl";
import DeliveryRetryControl from "@/features/staff/DeliveryRetryControl";
import { getAuthenticatedPrincipal } from "@/server/auth/session";
import { getRepairCase } from "@/server/repairs/service";

export default async function StaffRepairDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await connection();
    const principal = await getAuthenticatedPrincipal();

    if (!principal) {
        redirect("/login");
    }

    if (principal.role !== "STAFF") {
        redirect("/repairs");
    }

    const { id } = await params;
    const repairCase = await getRepairCase(principal, id);

    return (
        <CouncilPageShell
            breadcrumbs={[
                { label: "Home", href: "/" },
                { label: "Repair inbox", href: "/staff/repairs" },
                { label: repairCase.reference },
            ]}
        >
            <article className="border-t-8 border-civic-accent bg-civic-surface px-5 py-8 outline outline-1 outline-civic-line sm:px-10 sm:py-11">
                <RepairCaseDetails
                    repairCase={repairCase}
                    staff
                    statusControl={
                        <>
                            <RepairStatusControl
                                caseId={repairCase.id}
                                currentStatus={repairCase.status}
                            />
                            {repairCase.deliveryStatus === "FAILED" && (
                                <DeliveryRetryControl caseId={repairCase.id} />
                            )}
                        </>
                    }
                />
            </article>
        </CouncilPageShell>
    );
}
