import type { ReactNode } from "react";

export default function CouncilPageShell({ children }: { children: ReactNode }) {
    return (
        <div id="top" className="flex min-h-screen flex-col bg-slate-100">
            <a
                href="#main-content"
                className="sr-only z-50 bg-amber-300 px-4 py-3 font-bold text-slate-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
            >
                Skip to main content
            </a>

            <header className="border-t-4 border-amber-400 bg-white">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-5 sm:px-6 lg:px-8">
                    <a
                        href="#top"
                        className="group flex items-center gap-4 rounded-sm focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
                        aria-label="Westbridge Council home"
                    >
                        <span
                            aria-hidden="true"
                            className="grid h-14 w-14 place-items-center rounded-md bg-[#075e68] text-lg font-extrabold tracking-tight text-white shadow-sm"
                        >
                            WC
                        </span>
                        <span>
                            <span className="block text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                                Westbridge Council
                            </span>
                            <span className="mt-0.5 block text-sm font-medium text-slate-600">
                                Serving Westbridge communities
                            </span>
                        </span>
                    </a>
                </div>

                <nav aria-label="Primary navigation" className="bg-[#173b57] text-white">
                    <ul className="mx-auto flex w-full max-w-6xl flex-wrap px-4 sm:px-6 lg:px-8">
                        <li>
                            <a
                                href="#top"
                                className="block border-b-4 border-transparent px-4 py-3 font-semibold hover:border-amber-400 hover:bg-white/10 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-amber-300"
                            >
                                Home
                            </a>
                        </li>
                        <li>
                            <a
                                href="#main-content"
                                aria-current="page"
                                className="block border-b-4 border-amber-400 bg-white/10 px-4 py-3 font-semibold focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-amber-300"
                            >
                                Report a housing repair
                            </a>
                        </li>
                    </ul>
                </nav>
            </header>

            <div className="border-b border-slate-200 bg-white">
                <nav
                    aria-label="Breadcrumb"
                    className="mx-auto w-full max-w-6xl px-4 py-4 text-sm sm:px-6 lg:px-8"
                >
                    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600">
                        <li>
                            <a
                                href="#top"
                                className="font-medium text-[#075e68] underline decoration-1 underline-offset-4 hover:decoration-2"
                            >
                                Home
                            </a>
                        </li>
                        <li aria-hidden="true" className="text-slate-400">
                            /
                        </li>
                        <li>Housing</li>
                        <li aria-hidden="true" className="text-slate-400">
                            /
                        </li>
                        <li aria-current="page" className="font-medium text-slate-900">
                            Report a housing repair
                        </li>
                    </ol>
                </nav>
            </div>

            <main
                id="main-content"
                className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12"
            >
                {children}
            </main>

            <footer className="border-t-4 border-[#075e68] bg-[#173b57] text-white">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-7 sm:px-6 lg:px-8">
                    <p className="font-bold">Westbridge Council</p>
                    <p className="text-sm text-slate-200">
                        Serving Westbridge communities
                    </p>
                </div>
            </footer>
        </div>
    );
}
