export type TextSize = "normal" | "large" | "extraLarge";
export type InformationDensity = "full" | "reduced";
export type LanguageMode = "standard" | "plain";
export type JourneyMode = "normal" | "stepByStep";
export type TargetSize = "normal" | "large";
export type MotionPreference = "normal" | "reduced";

export type ExperiencePreferences = {
    textSize: TextSize;
    informationDensity: InformationDensity;
    languageMode: LanguageMode;
    journeyMode: JourneyMode;
    targetSize: TargetSize;
    motion: MotionPreference;
}