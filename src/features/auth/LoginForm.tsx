"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function LoginForm() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");
        const result = await authClient.signIn.email({
            email,
            password,
            rememberMe: false,
        });

        if (result.error) {
            setError(
                result.error.status === 429
                    ? "Too many sign-in attempts. Wait a few minutes and try again."
                    : "The email or password was not recognised.",
            );
            setIsSubmitting(false);
            return;
        }

        router.push("/");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="mt-8 max-w-xl">
            <div>
                <label
                    htmlFor="email"
                    className="block text-lg font-bold text-civic-ink"
                >
                    Email address
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    className="civic-field mt-3 min-h-12 px-3 py-2.5"
                />
            </div>
            <div className="mt-6">
                <label
                    htmlFor="password"
                    className="block text-lg font-bold text-civic-ink"
                >
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    minLength={12}
                    className="civic-field mt-3 min-h-12 px-3 py-2.5"
                />
            </div>

            {error && (
                <p
                    role="alert"
                    className="mt-6 border-l-8 border-civic-danger bg-civic-danger-soft px-5 py-4 font-bold text-civic-danger"
                >
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="civic-button civic-button-primary mt-7 min-h-12 px-6 py-3 disabled:opacity-60"
            >
                {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
        </form>
    );
}
