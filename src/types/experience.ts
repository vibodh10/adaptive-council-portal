export const TEXT_SIZES = ["normal", "large", "extraLarge"] as const;
export const INFORMATION_DENSITIES = ["full", "reduced"] as const;
export const LANGUAGE_MODES = ["standard", "plain"] as const;
export const JOURNEY_MODES = ["normal", "stepByStep"] as const;
export const TARGET_SIZES = ["normal", "large"] as const;
export const MOTION_PREFERENCES = ["normal", "reduced"] as const;

export type TextSize = (typeof TEXT_SIZES)[number];
export type InformationDensity = (typeof INFORMATION_DENSITIES)[number];
export type LanguageMode = (typeof LANGUAGE_MODES)[number];
export type JourneyMode = (typeof JOURNEY_MODES)[number];
export type TargetSize = (typeof TARGET_SIZES)[number];
export type MotionPreference = (typeof MOTION_PREFERENCES)[number];

export type ExperiencePreferences = {
    textSize: TextSize;
    informationDensity: InformationDensity;
    languageMode: LanguageMode;
    journeyMode: JourneyMode;
    targetSize: TargetSize;
    motion: MotionPreference;
};
