"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from "react";

import { validateHousingRepairReport } from "@/lib/submitHousingRepairReport";
import type { HousingRepairReport } from "@/types/housingRepair";

export function createEmptyHousingRepairReport(): HousingRepairReport {
    return {
        address: "",
        repairType: null,
        issueDescription: "",
        whenProblemStarted: "",
        isGettingWorse: null,
        immediateDanger: null,
        accessNotes: "",
        additionalNotes: "",
    };
}

type HousingRepairContextValue = {
    report: HousingRepairReport;
    setReport: React.Dispatch<React.SetStateAction<HousingRepairReport>>;
    isReviewing: boolean;
    openReview: (reportToReview: HousingRepairReport) => void;
    closeReview: () => void;
    resetReport: () => void;
};

const HousingRepairContext =
    createContext<HousingRepairContextValue | null>(null);

export function HousingRepairProvider({ children }: { children: ReactNode }) {
    const [report, setReport] = useState<HousingRepairReport>(
        createEmptyHousingRepairReport,
    );
    const [isReviewing, setIsReviewing] = useState(false);

    const openReview = useCallback((reportToReview: HousingRepairReport) => {
        validateHousingRepairReport(reportToReview);
        setIsReviewing(true);
    }, []);

    const closeReview = useCallback(() => {
        setIsReviewing(false);
    }, []);

    const resetReport = useCallback(() => {
        setReport(createEmptyHousingRepairReport());
        setIsReviewing(false);
    }, []);

    return (
        <HousingRepairContext.Provider
            value={{
                report,
                setReport,
                isReviewing,
                openReview,
                closeReview,
                resetReport,
            }}
        >
            {children}
        </HousingRepairContext.Provider>
    );
}

export function useHousingRepair() {
    const context = useContext(HousingRepairContext);

    if (!context) {
        throw new Error(
            "useHousingRepair must be used within the HousingRepairProvider",
        );
    }

    return context;
}
