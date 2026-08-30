"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function AccountNavigation() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();
    const [isSigningOut, setIsSigningOut] = useState(false);

    if (isPending) {
        return (
            <span className="text-sm text-white/75" aria-live="polite">
                Checking sign-in…
            </span>
        );
    }

    if (!session) {
        return (
            <Link
                href="/login"
                className="civic-button min-h-11 border border-white bg-white px-4 py-2 text-sm font-black text-civic-ink hover:bg-civic-paper focus-visible:outline-civic-focus"
            >
                Sign in
            </Link>
        );
    }

    const destination =
        session.user.role === "STAFF" ? "/staff/repairs" : "/repairs";

    return (
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
            <Link
                href={destination}
                className="font-bold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-civic-focus"
            >
                {session.user.role === "STAFF" ? "Staff repairs" : "My repairs"}
            </Link>
            <button
                type="button"
                disabled={isSigningOut}
                onClick={async () => {
                    setIsSigningOut(true);
                    await authClient.signOut();
                    router.push("/");
                    router.refresh();
                    setIsSigningOut(false);
                }}
                className="min-h-11 border border-white/50 px-4 py-2 font-bold text-white hover:border-white hover:bg-white/10 disabled:opacity-60 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-civic-focus"
            >
                {isSigningOut ? "Signing out…" : "Sign out"}
            </button>
        </div>
    );
}
