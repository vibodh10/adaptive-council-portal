"use client";

import { useExperience } from "@/features/experience/ExperienceProvider";

type PreferenceToggleProps = {
    label: string;
    description: string;
    isPressed: boolean;
    isLargeTarget: boolean;
    showDescription: boolean;
    onToggle: () => void;
};

function PreferenceToggle({
    label,
    description,
    isPressed,
    isLargeTarget,
    showDescription,
    onToggle,
}: PreferenceToggleProps) {
    return (
        <button
            type="button"
            aria-pressed={isPressed}
            onClick={onToggle}
            className={`group flex w-full items-center gap-3 border-2 text-left transition-colors ${
                isPressed
                    ? "border-civic-accent bg-civic-accent-soft text-civic-ink"
                    : "border-civic-line bg-civic-surface text-civic-ink hover:border-civic-accent hover:bg-civic-accent-soft"
            } ${isLargeTarget ? "min-h-16 px-4 py-3" : "min-h-12 px-3 py-2.5"}`}
        >
            <span
                aria-hidden="true"
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-sm font-black ${
                    isPressed
                        ? "border-civic-accent bg-civic-accent text-white"
                        : "border-civic-line bg-civic-surface text-civic-ink-soft group-hover:border-civic-accent"
                }`}
            >
                {isPressed ? "✓" : "+"}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block font-bold leading-5">{label}</span>
                {showDescription && (
                    <span className="mt-0.5 block text-xs leading-4 text-civic-ink-soft">
                        {description}
                    </span>
                )}
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-civic-accent-dark">
                {isPressed ? "On" : "Off"}
            </span>
        </button>
    );
}

export default function ExperienceControls() {
    const { preferences, setPreferences } = useExperience();
    const isLargeTarget = preferences.targetSize === "large";
    const showDescription = preferences.informationDensity === "full";
    const panelTextClass =
        preferences.textSize === "extraLarge"
            ? "text-lg"
            : preferences.textSize === "large"
                ? "text-base"
                : "text-sm";

    return (
        <section
            id="page-support"
            aria-labelledby="experience-controls-title"
            className={`${panelTextClass} scroll-mt-6 border-t-4 border-civic-mint-strong bg-civic-surface`}
        >
            <div className="border-x border-civic-line px-5 pb-4 pt-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-civic-mint-strong">
                    Page support
                </p>
                <h2
                    id="experience-controls-title"
                    className="civic-display mt-2 text-2xl leading-tight text-civic-ink"
                >
                    Make this page easier for me
                </h2>
                {showDescription && (
                    <p className="mt-2 leading-6 text-civic-ink-soft">
                        Choose any options that help. Your answers will stay in
                        place.
                    </p>
                )}
            </div>

            <div className="grid gap-2 border border-civic-line bg-civic-surface-muted p-3">
                <PreferenceToggle
                    label="Larger text"
                    description="Increase the size of headings and questions."
                    isPressed={preferences.textSize !== "normal"}
                    isLargeTarget={isLargeTarget}
                    showDescription={showDescription}
                    onToggle={() =>
                        setPreferences((current) => ({
                            ...current,
                            textSize:
                                current.textSize === "normal"
                                    ? "extraLarge"
                                    : "normal",
                        }))
                    }
                />
                <PreferenceToggle
                    label="Bigger controls"
                    description="Make fields and buttons easier to select."
                    isPressed={isLargeTarget}
                    isLargeTarget={isLargeTarget}
                    showDescription={showDescription}
                    onToggle={() =>
                        setPreferences((current) => ({
                            ...current,
                            targetSize:
                                current.targetSize === "large"
                                    ? "normal"
                                    : "large",
                        }))
                    }
                />
                <PreferenceToggle
                    label="Less clutter"
                    description="Hide extra explanations and optional details."
                    isPressed={preferences.informationDensity === "reduced"}
                    isLargeTarget={isLargeTarget}
                    showDescription={showDescription}
                    onToggle={() =>
                        setPreferences((current) => ({
                            ...current,
                            informationDensity:
                                current.informationDensity === "full"
                                    ? "reduced"
                                    : "full",
                        }))
                    }
                />
                <PreferenceToggle
                    label="Simpler words"
                    description="Use shorter, more direct questions."
                    isPressed={preferences.languageMode === "plain"}
                    isLargeTarget={isLargeTarget}
                    showDescription={showDescription}
                    onToggle={() =>
                        setPreferences((current) => ({
                            ...current,
                            languageMode:
                                current.languageMode === "standard"
                                    ? "plain"
                                    : "standard",
                        }))
                    }
                />
                <PreferenceToggle
                    label="Step by step"
                    description="Show one clear question at a time."
                    isPressed={preferences.journeyMode === "stepByStep"}
                    isLargeTarget={isLargeTarget}
                    showDescription={showDescription}
                    onToggle={() =>
                        setPreferences((current) => ({
                            ...current,
                            journeyMode:
                                current.journeyMode === "normal"
                                    ? "stepByStep"
                                    : "normal",
                        }))
                    }
                />
                <PreferenceToggle
                    label="Less movement"
                    description="Remove non-essential visual movement."
                    isPressed={preferences.motion === "reduced"}
                    isLargeTarget={isLargeTarget}
                    showDescription={showDescription}
                    onToggle={() =>
                        setPreferences((current) => ({
                            ...current,
                            motion:
                                current.motion === "normal"
                                    ? "reduced"
                                    : "normal",
                        }))
                    }
                />
            </div>
        </section>
    );
}
