import type { ReactNode } from "react";
import Link from "next/link";

import AccountNavigation from "@/components/AccountNavigation";
import CivicMark from "@/components/CivicMark";

type BreadcrumbItem = {
    label: string;
    href?: string;
};

export default function CouncilPageShell({
    children,
    breadcrumbs = [
        { label: "Home", href: "/" },
        { label: "Housing" },
        { label: "Report a housing repair" },
    ],
    currentNav = "housing",
}: {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    currentNav?: "home" | "housing";
}) {
    return (
        <div id="top" className="flex min-h-screen flex-col bg-civic-paper">
            <a
                href="#main-content"
                className="sr-only z-50 border-2 border-civic-ink bg-civic-focus px-5 py-3 font-bold text-civic-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
            >
                Skip to main content
            </a>

            <header className="border-t-8 border-civic-accent bg-civic-ink text-white">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                    <a
                        href="#top"
                        className="group flex min-w-0 items-center gap-4 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-civic-focus"
                        aria-label="Westbridge Council home"
                    >
                        <CivicMark className="h-13 w-13 border-civic-accent text-civic-accent sm:h-16 sm:w-16" />
                        <span className="min-w-0">
                            <span className="block text-xs font-extrabold uppercase tracking-[0.22em] text-civic-mint">
                                Westbridge
                            </span>
                            <span className="civic-display mt-0.5 block text-3xl leading-none text-white sm:text-4xl">
                                Council
                            </span>
                        </span>
                    </a>

                    <div className="flex min-w-fit flex-col items-end gap-3 border-l border-white/25 pl-4 sm:pl-6">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-bold text-white">
                                Housing and homes
                            </p>
                            <p className="mt-1 text-sm text-civic-mint">
                                A service shaped around residents
                            </p>
                        </div>
                        <AccountNavigation />
                    </div>
                </div>

                <nav
                    aria-label="Primary navigation"
                    className="border-t border-white/15 bg-civic-surface text-civic-ink"
                >
                    <ul className="mx-auto flex w-full max-w-7xl flex-wrap px-4 sm:px-6 lg:px-8">
                        <li>
                            <Link
                                href="/"
                                aria-current={
                                    currentNav === "home" ? "page" : undefined
                                }
                                className="block border-b-4 border-transparent px-3 py-4 font-bold hover:border-civic-line hover:bg-civic-paper focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-civic-focus sm:px-5"
                            >
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/"
                                aria-current={
                                    currentNav === "housing"
                                        ? "page"
                                        : undefined
                                }
                                className={`block border-b-4 px-3 py-4 font-bold focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-civic-focus sm:px-5 ${
                                    currentNav === "housing"
                                        ? "border-civic-accent bg-civic-accent-soft text-civic-accent-dark"
                                        : "border-transparent hover:border-civic-line hover:bg-civic-paper"
                                }`}
                            >
                                Housing repairs
                            </Link>
                        </li>
                    </ul>
                </nav>
            </header>

            {process.env.DEMO_MODE === "true" && (
                <div className="border-b border-civic-attention bg-civic-attention-soft text-civic-ink">
                    <p className="mx-auto w-full max-w-7xl px-4 py-3 text-sm font-bold sm:px-6 lg:px-8">
                        Westbridge Council is a demonstration tenant. Please use
                        test information only.
                    </p>
                </div>
            )}

            <div className="border-b border-civic-line bg-civic-surface-muted">
                <nav
                    aria-label="Breadcrumb"
                    className="mx-auto w-full max-w-7xl px-4 py-3 text-sm sm:px-6 lg:px-8"
                >
                    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-civic-ink-soft">
                        {breadcrumbs.map((item, index) => {
                            const isLast = index === breadcrumbs.length - 1;

                            return (
                                <li
                                    key={`${item.label}-${index}`}
                                    className="flex items-center gap-x-2"
                                >
                                    {index > 0 && (
                                        <span
                                            aria-hidden="true"
                                            className="mx-1 text-civic-line"
                                        >
                                            ›
                                        </span>
                                    )}
                                    {item.href && !isLast ? (
                                        <a
                                            href={item.href}
                                            className="font-bold text-civic-accent-dark underline decoration-1 underline-offset-4 hover:decoration-2"
                                        >
                                            {item.label}
                                        </a>
                                    ) : (
                                        <span
                                            aria-current={
                                                isLast ? "page" : undefined
                                            }
                                            className={
                                                isLast
                                                    ? "font-bold text-civic-ink"
                                                    : undefined
                                            }
                                        >
                                            {item.label}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            </div>

            <main
                id="main-content"
                className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16"
            >
                {children}
            </main>

            <footer className="mt-8 border-t-8 border-civic-accent bg-civic-ink text-white">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <CivicMark className="h-10 w-10 border-civic-accent text-civic-accent" />
                        <div>
                            <p className="font-bold">Westbridge Council</p>
                            <p className="mt-0.5 text-sm text-civic-mint">
                                Serving Westbridge communities
                            </p>
                        </div>
                    </div>
                    <div className="max-w-sm text-sm leading-6 text-white/75 sm:text-right">
                        <p>
                            Westbridge Council is a fictional demonstration
                            tenant.
                        </p>
                        <p className="mt-1 font-bold text-civic-mint">
                            Powered by Necivia
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
