"use client";

import { useExperience } from "@/features/experience/ExperienceProvider";

export default function ExperienceControls() {
    const { preferences, setPreferences } = useExperience();
    const controlButtonClassName =
        "rounded-md border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400";

    return (
        <section
            aria-label="Page display options"
            className="mb-8 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm"
        >
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                <p className="font-bold text-slate-950">Page display options</p>
                <p className="mt-1 text-sm text-slate-600">
                    Adjust how this page is presented to suit your needs.
                </p>
            </div>

            <div className="flex flex-wrap gap-3 px-5 py-5 sm:px-6">
            <button
                type="button"
                onClick={() =>
                    setPreferences({
                        ...preferences,
                        textSize:
                            preferences.textSize === "extraLarge"
                                ? "normal"
                                : "extraLarge",
                    })
                }
                className={controlButtonClassName}
            >
                Toggle large text
            </button>

            <button
                type="button"
                onClick={() =>
                    setPreferences({
                        ...preferences,
                        targetSize:
                            preferences.targetSize === "large"
                                ? "normal"
                                : "large",
                    })
                }
                className={controlButtonClassName}
            >
                Toggle large controls
            </button>

            <button
                type="button"
                onClick={() =>
                    setPreferences({
                        ...preferences,
                        informationDensity:
                            preferences.informationDensity === "full"
                                ? "reduced"
                                : "full",
                    })
                }
                className={controlButtonClassName}
            >
                Toggle reduced clutter
            </button>

            <button
                type="button"
                onClick={() =>
                    setPreferences({
                        ...preferences,
                        languageMode:
                            preferences.languageMode === "standard"
                                ? "plain"
                                : "standard",
                    })
                }
                className={controlButtonClassName}
            >
                Toggle plain language
            </button>

            <button
                type="button"
                onClick={() =>
                    setPreferences({
                        ...preferences,
                        journeyMode:
                            preferences.journeyMode === "normal"
                                ? "stepByStep"
                                : "normal",
                    })
                }
                className={controlButtonClassName}
            >
                Toggle step-by-step
            </button>
            </div>
        </section>
    );
}
