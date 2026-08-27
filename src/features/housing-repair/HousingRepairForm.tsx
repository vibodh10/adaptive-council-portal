"use client";

import React, { useState, type ReactNode } from "react";

import { useExperience } from "@/features/experience/ExperienceProvider";
import {
    submitHousingRepairReport,
    validateHousingRepairReport,
} from "@/lib/submitHousingRepairReport";
import type {
    HousingRepairReport,
    RepairType,
} from "@/types/housingRepair";

const repairTypeLabels: Record<RepairType, string> = {
    plumbing: "Plumbing",
    heating: "Heating",
    electrical: "Electrical",
    roof_or_ceiling: "Roof or ceiling",
    windows_or_doors: "Windows or doors",
    damp_or_mould: "Damp or mould",
    structural: "Structural",
    other: "Other",
};

type HousingRepairStep =
    | "address"
    | "repairType"
    | "issueDescription"
    | "whenProblemStarted"
    | "isGettingWorse"
    | "immediateDanger"
    | "accessNotes"
    | "additionalNotes";

function SummaryRow({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-1 border-b border-slate-200 px-4 py-4 last:border-b-0 sm:grid-cols-[13rem_1fr] sm:gap-6">
            <dt className="font-semibold text-slate-700">{label}</dt>
            <dd className="whitespace-pre-wrap text-slate-950">{children}</dd>
        </div>
    );
}

function formatReviewDate(value: string): string {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
}

export default function HousingRepairForm() {
    const { preferences } = useExperience();
    const isPlainLanguage = preferences.languageMode === "plain";
    const isReducedClutter = preferences.informationDensity === "reduced";
    const isStepByStep = preferences.journeyMode === "stepByStep";
    const isLargeTarget = preferences.targetSize === "large";

    const textSizeClass =
        preferences.textSize === "extraLarge"
            ? "text-xl"
            : preferences.textSize === "large"
                ? "text-lg"
                : "text-base";
    const headingClassName =
        preferences.textSize === "extraLarge"
            ? "text-4xl"
            : preferences.textSize === "large"
                ? "text-3xl"
                : "text-2xl";
    const fieldClassName = `mt-2 block w-full max-w-xl rounded-md border border-slate-400 bg-white text-slate-950 shadow-sm transition-colors hover:border-slate-500 focus:border-[#075e68] focus:outline-none focus:ring-4 focus:ring-[#075e68]/20 ${
        isLargeTarget ? "min-h-12 px-4 py-3" : "px-3 py-2"
    }`;
    const buttonSizeClassName = isLargeTarget
        ? "min-h-12 px-6 py-3"
        : "px-4 py-2";
    const radioClassName = `${isLargeTarget ? "h-8 w-8" : "h-5 w-5"} shrink-0 accent-[#075e68]`;
    const choiceLabelClassName = `flex cursor-pointer items-center gap-3 rounded-md border border-slate-300 bg-white font-medium text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50 ${
        isLargeTarget ? "min-h-14 px-4 py-3" : "px-3 py-2"
    }`;
    const primaryButtonClassName = `rounded-md bg-[#075e68] font-semibold text-white shadow-sm transition-colors hover:bg-[#054951] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${buttonSizeClassName}`;
    const secondaryButtonClassName = `rounded-md border border-slate-400 bg-white font-semibold text-[#173b57] shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${buttonSizeClassName}`;
    const questionClassName = isStepByStep
        ? "mt-8"
        : "mt-8 border-t border-slate-200 pt-8";

    const [report, setReport] = useState<HousingRepairReport>({
        address: "",
        repairType: null,
        issueDescription: "",
        whenProblemStarted: "",
        isGettingWorse: null,
        immediateDanger: null,
        accessNotes: "",
        additionalNotes: "",
    });
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isReviewing, setIsReviewing] = useState(false);
    const [stepError, setStepError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [reference, setReference] = useState<string | null>(null);

    const requiredSteps: HousingRepairStep[] = [
        "address",
        "repairType",
        "issueDescription",
        "whenProblemStarted",
        "isGettingWorse",
        "immediateDanger",
    ];
    const optionalSteps: HousingRepairStep[] = [
        "accessNotes",
        "additionalNotes",
    ];
    const steps = isReducedClutter
        ? [...requiredSteps, "accessNotes" as const]
        : [...requiredSteps, ...optionalSteps];
    const activeStepIndex = Math.min(currentStepIndex, steps.length - 1);
    const activeStep = steps[activeStepIndex];
    const totalJourneySteps = steps.length + 1;
    const showQuestion = (step: HousingRepairStep) =>
        !isStepByStep || activeStep === step;

    function getStepError(step: HousingRepairStep): string | null {
        if (step === "address" && !report.address.trim()) {
            return "Enter the address of the property.";
        }

        if (step === "repairType" && !report.repairType) {
            return "Select the type of repair needed.";
        }

        if (step === "issueDescription" && !report.issueDescription.trim()) {
            return "Describe the repair issue.";
        }

        if (step === "whenProblemStarted") {
            if (!report.whenProblemStarted) {
                return "Enter when the problem started.";
            }

            const problemStartDate = new Date(
                `${report.whenProblemStarted}T00:00:00`,
            );
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (
                Number.isNaN(problemStartDate.getTime()) ||
                problemStartDate > today
            ) {
                return "Enter a valid date that is not in the future.";
            }
        }

        if (step === "isGettingWorse" && report.isGettingWorse === null) {
            return "Select whether the problem is getting worse.";
        }

        if (step === "immediateDanger" && report.immediateDanger === null) {
            return "Select whether there is an immediate danger.";
        }

        return null;
    }

    function openReview() {
        setStepError(null);
        setSubmitError(null);

        try {
            validateHousingRepairReport(report);
            setIsReviewing(true);
        } catch (error) {
            if (error instanceof Error) {
                setStepError(error.message);
            } else {
                setStepError("Check the repair details before continuing.");
            }
        }
    }

    function handleReview(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        openReview();
    }

    function handleNext() {
        setStepError(null);

        const error = getStepError(activeStep);

        if (error) {
            setStepError(error);
            return;
        }

        if (activeStepIndex === steps.length - 1) {
            openReview();
            return;
        }

        setCurrentStepIndex(activeStepIndex + 1);
    }

    function handleConfirm() {
        setSubmitError(null);

        try {
            const result = submitHousingRepairReport(report);
            setReference(result.reference);
        } catch (error) {
            if (error instanceof Error) {
                setSubmitError(error.message);
            } else {
                setSubmitError(
                    "Something went wrong while submitting the repair report.",
                );
            }
        }
    }

    const dangerWarning = (
        <div
            role="alert"
            className="mt-5 rounded-md border-l-4 border-red-700 bg-red-50 px-4 py-4 text-red-950"
        >
            <p className="font-bold">You told us there is an immediate danger.</p>
            <p className="mt-1">
                Move away from the affected area. If anyone is in immediate
                danger, contact the emergency services. This form does not
                contact them for you.
            </p>
        </div>
    );

    if (reference) {
        return (
            <div className={`${textSizeClass} text-slate-800`}>
                <h1 className={`${headingClassName} font-bold tracking-tight text-slate-950`}>
                    Housing repair reported
                </h1>
                <div className="mt-6 rounded-md border-l-4 border-emerald-700 bg-emerald-50 px-4 py-4 text-emerald-950">
                    <p className="font-semibold">
                        Your repair reference is {reference}.
                    </p>
                </div>
            </div>
        );
    }

    if (isReviewing) {
        return (
            <div className={`${textSizeClass} text-slate-800`}>
                {isStepByStep && (
                    <p className="mb-3 inline-flex rounded-full bg-[#e7f3f4] px-3 py-1 font-semibold text-[#075e68]">
                        Step {totalJourneySteps} of {totalJourneySteps}
                    </p>
                )}

                <h1 className={`${headingClassName} font-bold tracking-tight text-slate-950`}>
                    Review your repair report
                </h1>

                {!isReducedClutter && (
                    <p className="mt-3 max-w-2xl text-slate-700">
                        Check the details below. You can go back and change
                        anything before submitting the report.
                    </p>
                )}

                {report.immediateDanger === true && dangerWarning}

                <dl className="mt-7 overflow-hidden rounded-md border border-slate-300 bg-white">
                    <SummaryRow label="Property address">
                        {report.address}
                    </SummaryRow>
                    <SummaryRow label="Repair type">
                        {report.repairType
                            ? repairTypeLabels[report.repairType]
                            : "Not provided"}
                    </SummaryRow>
                    <SummaryRow label="Issue description">
                        {report.issueDescription}
                    </SummaryRow>
                    <SummaryRow label="Problem started">
                        {formatReviewDate(report.whenProblemStarted)}
                    </SummaryRow>
                    <SummaryRow label="Getting worse">
                        {report.isGettingWorse ? "Yes" : "No"}
                    </SummaryRow>
                    <SummaryRow label="Immediate danger">
                        <span
                            className={
                                report.immediateDanger
                                    ? "font-bold text-red-800"
                                    : undefined
                            }
                        >
                            {report.immediateDanger ? "Yes" : "No"}
                        </span>
                    </SummaryRow>
                    {report.accessNotes?.trim() && (
                        <SummaryRow label="Access notes">
                            {report.accessNotes}
                        </SummaryRow>
                    )}
                    {report.additionalNotes?.trim() && (
                        <SummaryRow label="Additional notes">
                            {report.additionalNotes}
                        </SummaryRow>
                    )}
                </dl>

                {submitError && (
                    <p
                        role="alert"
                        className="mt-5 rounded-md border-l-4 border-red-700 bg-red-50 px-4 py-3 font-semibold text-red-800"
                    >
                        {submitError}
                    </p>
                )}

                <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
                    <button
                        type="button"
                        onClick={() => {
                            setSubmitError(null);
                            setIsReviewing(false);
                        }}
                        className={secondaryButtonClassName}
                    >
                        Back and change answers
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className={primaryButtonClassName}
                    >
                        Confirm and submit
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleReview}
            className={`${textSizeClass} text-slate-800`}
        >
            <h1 className={`${headingClassName} font-bold tracking-tight text-slate-950`}>
                Report a housing repair
            </h1>

            {!isReducedClutter && (
                <p className="mt-3 max-w-2xl text-slate-700">
                    Tell us about a repair needed at your council property. You
                    will review your answers before submitting them.
                </p>
            )}

            {isStepByStep && (
                <p className="mt-4 inline-flex rounded-full bg-[#e7f3f4] px-3 py-1 font-semibold text-[#075e68]">
                    Step {activeStepIndex + 1} of {totalJourneySteps}
                </p>
            )}

            {showQuestion("address") && (
                <div className={questionClassName}>
                    <label
                        htmlFor="housing-address"
                        className="block font-semibold text-slate-950"
                    >
                        {isPlainLanguage
                            ? "What is your home address?"
                            : "What is the address of the property?"}
                    </label>
                    <input
                        id="housing-address"
                        type="text"
                        autoComplete="street-address"
                        value={report.address}
                        onChange={(event) =>
                            setReport({
                                ...report,
                                address: event.target.value,
                            })
                        }
                        className={fieldClassName}
                    />
                </div>
            )}

            {showQuestion("repairType") && (
                <div className={questionClassName}>
                    <label
                        htmlFor="repair-type"
                        className="block font-semibold text-slate-950"
                    >
                        {isPlainLanguage
                            ? "What needs fixing?"
                            : "What type of repair is needed?"}
                    </label>
                    <select
                        id="repair-type"
                        value={report.repairType ?? ""}
                        onChange={(event) =>
                            setReport({
                                ...report,
                                repairType: event.target.value
                                    ? (event.target.value as RepairType)
                                    : null,
                            })
                        }
                        className={fieldClassName}
                    >
                        <option value="">Select a repair type</option>
                        {Object.entries(repairTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {showQuestion("issueDescription") && (
                <div className={questionClassName}>
                    <label
                        htmlFor="issue-description"
                        className="block font-semibold text-slate-950"
                    >
                        {isPlainLanguage
                            ? "Tell us what is wrong"
                            : "Describe the repair issue"}
                    </label>
                    {!isReducedClutter && (
                        <p id="issue-description-hint" className="mt-2 text-slate-600">
                            For example: There is water leaking through my ceiling.
                        </p>
                    )}
                    <textarea
                        id="issue-description"
                        rows={5}
                        aria-describedby={
                            isReducedClutter
                                ? undefined
                                : "issue-description-hint"
                        }
                        value={report.issueDescription}
                        onChange={(event) =>
                            setReport({
                                ...report,
                                issueDescription: event.target.value,
                            })
                        }
                        className={fieldClassName}
                    />
                </div>
            )}

            {showQuestion("whenProblemStarted") && (
                <div className={questionClassName}>
                    <label
                        htmlFor="problem-started"
                        className="block font-semibold text-slate-950"
                    >
                        {isPlainLanguage
                            ? "When did you first notice the problem?"
                            : "When did the problem start?"}
                    </label>
                    <input
                        id="problem-started"
                        type="date"
                        max={new Date().toLocaleDateString("en-CA")}
                        value={report.whenProblemStarted}
                        onChange={(event) =>
                            setReport({
                                ...report,
                                whenProblemStarted: event.target.value,
                            })
                        }
                        className={fieldClassName}
                    />
                </div>
            )}

            {showQuestion("isGettingWorse") && (
                <fieldset className={questionClassName}>
                    <legend className="font-semibold text-slate-950">
                        {isPlainLanguage
                            ? "Is the problem getting worse?"
                            : "Has the repair issue become worse over time?"}
                    </legend>
                    <div className="mt-3 flex max-w-md flex-col gap-3 sm:flex-row">
                        <label className={choiceLabelClassName}>
                            <input
                                type="radio"
                                name="is-getting-worse"
                                checked={report.isGettingWorse === true}
                                onChange={() =>
                                    setReport({
                                        ...report,
                                        isGettingWorse: true,
                                    })
                                }
                                className={radioClassName}
                            />
                            Yes
                        </label>
                        <label className={choiceLabelClassName}>
                            <input
                                type="radio"
                                name="is-getting-worse"
                                checked={report.isGettingWorse === false}
                                onChange={() =>
                                    setReport({
                                        ...report,
                                        isGettingWorse: false,
                                    })
                                }
                                className={radioClassName}
                            />
                            No
                        </label>
                    </div>
                </fieldset>
            )}

            {showQuestion("immediateDanger") && (
                <fieldset className={questionClassName}>
                    <legend className="font-semibold text-slate-950">
                        {isPlainLanguage
                            ? "Is anyone in danger right now?"
                            : "Does the issue present an immediate danger?"}
                    </legend>
                    {!isReducedClutter && (
                        <p className="mt-2 text-slate-600">
                            Consider risks such as exposed wiring, a collapsing
                            ceiling, flooding or loss of essential heating.
                        </p>
                    )}
                    <div className="mt-3 flex max-w-md flex-col gap-3 sm:flex-row">
                        <label className={choiceLabelClassName}>
                            <input
                                type="radio"
                                name="immediate-danger"
                                checked={report.immediateDanger === true}
                                onChange={() =>
                                    setReport({
                                        ...report,
                                        immediateDanger: true,
                                    })
                                }
                                className={radioClassName}
                            />
                            Yes
                        </label>
                        <label className={choiceLabelClassName}>
                            <input
                                type="radio"
                                name="immediate-danger"
                                checked={report.immediateDanger === false}
                                onChange={() =>
                                    setReport({
                                        ...report,
                                        immediateDanger: false,
                                    })
                                }
                                className={radioClassName}
                            />
                            No
                        </label>
                    </div>
                    {report.immediateDanger === true && dangerWarning}
                </fieldset>
            )}

            {showQuestion("accessNotes") && (
                <div className={questionClassName}>
                    <label
                        htmlFor="access-notes"
                        className="block font-semibold text-slate-950"
                    >
                        {isPlainLanguage
                            ? "Is there anything we need to know to get into your home?"
                            : "Are there any access instructions?"}{" "}
                        <span className="font-normal text-slate-600">
                            (optional)
                        </span>
                    </label>
                    <textarea
                        id="access-notes"
                        rows={3}
                        value={report.accessNotes ?? ""}
                        onChange={(event) =>
                            setReport({
                                ...report,
                                accessNotes: event.target.value,
                            })
                        }
                        className={fieldClassName}
                    />
                </div>
            )}

            {!isReducedClutter && showQuestion("additionalNotes") && (
                <div className={questionClassName}>
                    <label
                        htmlFor="additional-notes"
                        className="block font-semibold text-slate-950"
                    >
                        {isPlainLanguage
                            ? "Anything else you want to tell us?"
                            : "Additional information"}{" "}
                        <span className="font-normal text-slate-600">
                            (optional)
                        </span>
                    </label>
                    <textarea
                        id="additional-notes"
                        rows={3}
                        value={report.additionalNotes ?? ""}
                        onChange={(event) =>
                            setReport({
                                ...report,
                                additionalNotes: event.target.value,
                            })
                        }
                        className={fieldClassName}
                    />
                </div>
            )}

            {stepError && (
                <p
                    role="alert"
                    className="mt-6 rounded-md border-l-4 border-red-700 bg-red-50 px-4 py-3 font-semibold text-red-800"
                >
                    {stepError}
                </p>
            )}

            {isStepByStep ? (
                <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
                    {activeStepIndex > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setStepError(null);
                                setCurrentStepIndex(activeStepIndex - 1);
                            }}
                            className={secondaryButtonClassName}
                        >
                            Back
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleNext}
                        className={primaryButtonClassName}
                    >
                        {activeStepIndex === steps.length - 1
                            ? "Review answers"
                            : "Next"}
                    </button>
                </div>
            ) : (
                <button
                    type="submit"
                    className={`mt-8 ${primaryButtonClassName}`}
                >
                    Review repair report
                </button>
            )}
        </form>
    );
}
