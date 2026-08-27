"use client";

import React, {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";

import type { ExperiencePreferences } from "@/types/experience";

const defaultPreferences: ExperiencePreferences = {
    textSize: "normal",
    informationDensity: "full",
    languageMode: "standard",
    journeyMode: "normal",
    targetSize: "normal",
    motion: "normal",
};

type ExperienceContextValue = {
    preferences: ExperiencePreferences;
    setPreferences: React.Dispatch<
        React.SetStateAction<ExperiencePreferences>
    >;
};

const ExperienceContext =
    createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useState<ExperiencePreferences>(defaultPreferences);

    return (
        <ExperienceContext.Provider
            value={{preferences, setPreferences}}
        >
            {children}
        </ExperienceContext.Provider>
    )
}

export function useExperience() {
    const context = useContext(ExperienceContext);

    if (!context) {
        throw new Error(
            "useExperience must be used within the ExperienceProvider"
        );
    }

    return context;
}