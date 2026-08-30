"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import HousingRepairForm from "@/features/housing-repair/HousingRepairForm";
import { useHousingRepair } from "@/features/housing-repair/HousingRepairProvider";
import { authClient } from "@/lib/auth-client";

export default function HousingRepairGate() {
    const { data: session, isPending } = authClient.useSession();
    const { resetReport } = useHousingRepair();
    const previousUserId = useRef<string | null | undefined>(undefined);
    const currentUserId = session?.user.id ?? null;

    useEffect(() => {
        if (
            previousUserId.current !== undefined &&
            previousUserId.current !== currentUserId
        ) {
            resetReport();
        }

        previousUserId.current = currentUserId;
    }, [currentUserId, resetReport]);

    if (isPending) {
        return (
            <div role="status" className="py-10 text-civic-ink-soft">
                Checking your sign-in…
            </div>
        );
    }

    if (!session) {
        return (
            <div className="text-civic-ink">
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-civic-accent-dark">
                    Council housing service
                </p>
                <h1 className="civic-display mt-3 text-4xl leading-[1.05] sm:text-5xl">
                    Report a housing repair
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-civic-ink-soft">
                    Sign in so Westbridge can protect your repair details and
                    keep the report in your own case history.
                </p>
                <div className="mt-8 border-l-8 border-civic-accent bg-civic-accent-soft px-5 py-6 sm:px-7">
                    <p className="text-lg font-black">Resident sign-in required</p>
                    <p className="mt-2 max-w-xl leading-7">
                        You can still use Page Support before signing in. Repair
                        details are only available to an authenticated resident.
                    </p>
                    <Link
                        href="/login"
                        className="civic-button civic-button-primary mt-5 min-h-12 px-5 py-3"
                    >
                        Sign in to report a repair
                    </Link>
                </div>
            </div>
        );
    }

    if (session.user.role !== "RESIDENT") {
        return (
            <div className="text-civic-ink">
                <h1 className="civic-display text-4xl sm:text-5xl">
                    Staff repair service
                </h1>
                <p className="mt-5 max-w-2xl leading-7 text-civic-ink-soft">
                    You are signed in as council staff. Resident reports are
                    managed in the secure repair inbox.
                </p>
                <Link
                    href="/staff/repairs"
                    className="civic-button civic-button-primary mt-6 min-h-12 px-5 py-3"
                >
                    Open staff repair inbox
                </Link>
            </div>
        );
    }

    return <HousingRepairForm />;
}
