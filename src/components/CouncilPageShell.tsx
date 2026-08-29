import type { ReactNode } from "react";

import CivicMark from "@/components/CivicMark";

export default function CouncilPageShell({ children }: { children: ReactNode }) {
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

                    <div className="hidden border-l border-white/25 pl-6 text-right sm:block">
                        <p className="text-sm font-bold text-white">
                            Housing and homes
                        </p>
                        <p className="mt-1 text-sm text-civic-mint">
                            A service shaped around residents
                        </p>
                    </div>
                </div>

                <nav
                    aria-label="Primary navigation"
                    className="border-t border-white/15 bg-civic-surface text-civic-ink"
                >
                    <ul className="mx-auto flex w-full max-w-7xl flex-wrap px-4 sm:px-6 lg:px-8">
                        <li>
                            <a
                                href="#top"
                                className="block border-b-4 border-transparent px-3 py-4 font-bold hover:border-civic-line hover:bg-civic-paper focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-civic-focus sm:px-5"
                            >
                                Home
                            </a>
                        </li>
                        <li>
                            <a
                                href="#main-content"
                                aria-current="page"
                                className="block border-b-4 border-civic-accent bg-civic-accent-soft px-3 py-4 font-bold text-civic-accent-dark focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-civic-focus sm:px-5"
                            >
                                Housing repairs
                            </a>
                        </li>
                    </ul>
                </nav>
            </header>

            <div className="border-b border-civic-line bg-civic-surface-muted">
                <nav
                    aria-label="Breadcrumb"
                    className="mx-auto w-full max-w-7xl px-4 py-3 text-sm sm:px-6 lg:px-8"
                >
                    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-civic-ink-soft">
                        <li>
                            <a
                                href="#top"
                                className="font-bold text-civic-accent-dark underline decoration-1 underline-offset-4 hover:decoration-2"
                            >
                                Home
                            </a>
                        </li>
                        <li aria-hidden="true" className="text-civic-line">
                            <span className="mx-1">›</span>
                        </li>
                        <li>Housing</li>
                        <li aria-hidden="true" className="text-civic-line">
                            <span className="mx-1">›</span>
                        </li>
                        <li aria-current="page" className="font-bold text-civic-ink">
                            Report a housing repair
                        </li>
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
                    <p className="max-w-sm text-sm leading-6 text-white/75 sm:text-right">
                        A fictional council service demonstrating accessible,
                        adaptive public services.
                    </p>
                </div>
            </footer>
        </div>
    );
}
