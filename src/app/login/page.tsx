import type { Metadata } from "next";

import CouncilPageShell from "@/components/CouncilPageShell";
import LoginForm from "@/features/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
    return (
        <CouncilPageShell
            currentNav="home"
            breadcrumbs={[
                { label: "Home", href: "/" },
                { label: "Sign in" },
            ]}
        >
            <section className="border-t-8 border-civic-accent bg-civic-surface px-5 py-8 outline outline-1 outline-civic-line sm:px-10 sm:py-11">
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-civic-accent-dark">
                    Secure account
                </p>
                <h1 className="civic-display mt-3 text-4xl text-civic-ink sm:text-5xl">
                    Sign in to Necivia
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-civic-ink-soft">
                    Use your Westbridge resident or staff demonstration account.
                    Credentials are supplied privately for testing.
                </p>
                <LoginForm />
            </section>
        </CouncilPageShell>
    );
}
