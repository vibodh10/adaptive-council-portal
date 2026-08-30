"use client";

import { useEffect, useRef } from "react";

import { useExperience } from "@/features/experience/ExperienceProvider";
import { useHousingRepair } from "@/features/housing-repair/HousingRepairProvider";
import { authClient } from "@/lib/auth-client";
import type { ExperiencePreferences } from "@/types/experience";
import type { HousingRepairReport } from "@/types/housingRepair";
import { getDocumentModelContext } from "@/webmcp/modelContext";
import { registerWebMcpTools } from "@/webmcp/registerTools";
import { createWebMcpTools } from "@/webmcp/toolDefinitions";
import type {
    ExperiencePreferencesPatch,
    HousingRepairDraftPatch,
} from "@/webmcp/toolLogic";

const globalControllerKey = "__adaptiveCouncilWebMcpController";

type WebMcpRegistrationGlobal = typeof globalThis & {
    [globalControllerKey]?: AbortController;
};

export default function WebMcpRegistration() {
    const { data: session } = authClient.useSession();
    const { preferences, setPreferences } = useExperience();
    const {
        report,
        setReport,
        isReviewing,
        openReview,
    } = useHousingRepair();
    const stateRef = useRef({
        preferences,
        report,
        isReviewing,
        canAccessHousingRepair: session?.user.role === "RESIDENT",
    });
    const actionsRef = useRef({ setPreferences, setReport, openReview });

    useEffect(() => {
        stateRef.current = {
            preferences,
            report,
            isReviewing,
            canAccessHousingRepair: session?.user.role === "RESIDENT",
        };
        actionsRef.current = { setPreferences, setReport, openReview };
    }, [
        preferences,
        report,
        isReviewing,
        setPreferences,
        setReport,
        openReview,
        session?.user.role,
    ]);

    useEffect(() => {
        const modelContext = getDocumentModelContext(document);

        if (!modelContext) {
            return;
        }

        const registrationGlobal = globalThis as WebMcpRegistrationGlobal;
        registrationGlobal[globalControllerKey]?.abort();

        const controller = new AbortController();
        registrationGlobal[globalControllerKey] = controller;

        const tools = createWebMcpTools({
            getPreferences: () => stateRef.current.preferences,
            updatePreferences: (patch: ExperiencePreferencesPatch) => {
                const next: ExperiencePreferences = {
                    ...stateRef.current.preferences,
                    ...patch,
                };

                stateRef.current.preferences = next;
                actionsRef.current.setPreferences(next);
                return next;
            },
            getReport: () => stateRef.current.report,
            updateReport: (patch: HousingRepairDraftPatch) => {
                const next: HousingRepairReport = {
                    ...stateRef.current.report,
                    ...patch,
                };

                stateRef.current.report = next;
                actionsRef.current.setReport(next);
                return next;
            },
            getJourneyState: () => ({
                isReviewing: stateRef.current.isReviewing,
                journeyMode: stateRef.current.preferences.journeyMode,
            }),
            openReview: (reportToReview: HousingRepairReport) => {
                actionsRef.current.openReview(reportToReview);
                stateRef.current.isReviewing = true;
            },
            canAccessHousingRepair: () =>
                stateRef.current.canAccessHousingRepair,
        });

        void registerWebMcpTools(
            modelContext,
            tools,
            controller.signal,
        ).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                controller.abort();
                console.warn("WebMCP tools could not be registered.", error);
            }
        });

        return () => {
            controller.abort();

            if (registrationGlobal[globalControllerKey] === controller) {
                delete registrationGlobal[globalControllerKey];
            }
        };
    }, []);

    return null;
}
