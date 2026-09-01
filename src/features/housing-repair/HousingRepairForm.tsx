"use client";

import React, { useRef, useState, type ReactNode } from "react";

import { useExperience } from "@/features/experience/ExperienceProvider";
import { useHousingRepair } from "@/features/housing-repair/HousingRepairProvider";
import { repairTypeLabels } from "@/lib/housingRepairPresentation";
import type { RepairType } from "@/types/housingRepair";

type HousingRepairStep =
    | "address"
    | "repairType"
    | "issueDescription"
    | "whenProblemStarted"
    | "isGettingWorse"
    | "immediateDanger"
    | "accessNotes"
    | "additionalNotes"
    | "photos";

type SubmissionSuccess = {
    reference: string;
    caseId: string;
    deliveryStatus: "PENDING" | "SUCCEEDED" | "FAILED";
};

function SummaryRow({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-1 border-b border-civic-line-soft py-4 last:border-b-0 sm:grid-cols-[12rem_1fr] sm:gap-6">
            <dt className="font-bold text-civic-ink-soft">{label}</dt>
            <dd className="min-w-0 whitespace-pre-wrap font-medium text-civic-ink">
                {children}
            </dd>
        </div>
    );
}

function SectionHeading({
    number,
    title,
    description,
    showDescription,
}: {
    number: string;
    title: string;
    description: string;
    showDescription: boolean;
}) {
    return (
        <div className="mt-10 border-t-2 border-civic-ink pt-5 first:mt-8">
            <div className="flex items-baseline gap-3">
                <span
                    aria-hidden="true"
                    className="text-sm font-black tracking-[0.16em] text-civic-accent"
                >
                    {number}
                </span>
                <h2 className="civic-display text-2xl text-civic-ink sm:text-3xl">
                    {title}
                </h2>
            </div>
            {showDescription && (
                <p className="mt-2 max-w-2xl leading-7 text-civic-ink-soft">
                    {description}
                </p>
            )}
        </div>
    );
}

function JourneyProgress({ current, total }: { current: number; total: number }) {
    const percentage = Math.round((current / total) * 100);

    return (
        <div className="mt-7 border-y border-civic-line bg-civic-paper px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-4 text-sm font-bold">
                <span className="uppercase tracking-[0.14em] text-civic-mint-strong">
                    Your progress
                </span>
                <span className="text-civic-ink">
                    Step {current} of {total}
                </span>
            </div>
            <div
                role="progressbar"
                aria-label={`Step ${current} of ${total}`}
                aria-valuemin={1}
                aria-valuemax={total}
                aria-valuenow={current}
                className="mt-3 h-2 overflow-hidden bg-civic-line-soft"
            >
                <span
                    className="block h-full bg-civic-accent transition-[width] duration-200"
                    style={{ width: `${percentage}%` }}
                />
            </div>
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
    const {
        report,
        setReport,
        isReviewing,
        openReview: openSharedReview,
        closeReview,
    } = useHousingRepair();
    const isPlainLanguage = preferences.languageMode === "plain";
    const isReducedClutter = preferences.informationDensity === "reduced";
    const isStepByStep = preferences.journeyMode === "stepByStep";
    const isLargeTarget = preferences.targetSize === "large";

    const textSizeClass =
        preferences.textSize === "extraLarge"
            ? "text-xl leading-9"
            : preferences.textSize === "large"
                ? "text-lg leading-8"
                : "text-base leading-7";
    const headingClassName =
        preferences.textSize === "extraLarge"
            ? "text-5xl leading-[1.02] sm:text-6xl"
            : preferences.textSize === "large"
                ? "text-[2.7rem] leading-[1.05] sm:text-[3.25rem]"
                : "text-4xl leading-[1.05] sm:text-5xl";
    const fieldSizeClassName = isLargeTarget
        ? "min-h-14 px-4 py-3.5"
        : "min-h-12 px-3 py-2.5";
    const fieldClassName = `civic-field mt-3 ${fieldSizeClassName}`;
    const buttonSizeClassName = isLargeTarget
        ? "min-h-14 px-7 py-4"
        : "min-h-12 px-5 py-3";
    const radioClassName = `${isLargeTarget ? "h-7 w-7" : "h-5 w-5"} shrink-0 accent-civic-accent`;
    const choiceLabelClassName = `civic-choice-card font-bold ${
        isLargeTarget ? "min-h-[4.5rem] px-5 py-4" : "min-h-14 px-4 py-3"
    }`;
    const primaryButtonClassName = `civic-button civic-button-primary ${buttonSizeClassName}`;
    const secondaryButtonClassName = `civic-button civic-button-secondary ${buttonSizeClassName}`;
    const questionClassName = isStepByStep ? "py-2" : "mt-7";
    const labelClassName = "block text-[1.05em] font-bold leading-snug text-civic-ink";

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [stepError, setStepError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submission, setSubmission] = useState<SubmissionSuccess | null>(null);
    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const idempotencyKeyRef = useRef<string | null>(null);

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
        "photos",
    ];
    const steps = isReducedClutter
        ? [...requiredSteps, "accessNotes" as const, "photos" as const]
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
            openSharedReview(report);
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

    async function handleConfirm() {
        setSubmitError(null);
        setIsSubmitting(true);

        try {
            idempotencyKeyRef.current ??= crypto.randomUUID();
            const formData = new FormData();
            formData.set("report", JSON.stringify(report));
            formData.set("idempotencyKey", idempotencyKeyRef.current);

            for (const photo of selectedPhotos) {
                formData.append("photos", photo);
            }

            const response = await fetch("/api/repairs", {
                method: "POST",
                body: formData,
                credentials: "same-origin",
            });
            const result = (await response.json()) as {
                ok: boolean;
                reference?: string;
                caseId?: string;
                deliveryStatus?: SubmissionSuccess["deliveryStatus"];
                error?: { code?: string; message?: string };
            };

            if (
                !response.ok ||
                !result.ok ||
                !result.reference ||
                !result.caseId ||
                !result.deliveryStatus
            ) {
                throw new Error(
                    result.error?.message ??
                        "The repair could not be submitted. Your answers are still here.",
                );
            }

            setSubmission({
                reference: result.reference,
                caseId: result.caseId,
                deliveryStatus: result.deliveryStatus,
            });
        } catch (error) {
            if (error instanceof Error) {
                setSubmitError(error.message);
            } else {
                setSubmitError(
                    "Something went wrong while submitting the repair report.",
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const dangerWarning = (
        <div
            role="alert"
            className="mt-6 border-l-8 border-civic-danger bg-civic-danger-soft px-5 py-5 text-civic-ink"
        >
            <p className="text-lg font-black text-civic-danger">
                You told us there is an immediate danger
            </p>
            <p className="mt-2 max-w-2xl leading-7">
                Move away from the affected area. If anyone is in immediate
                danger, contact the emergency services. This form does not
                contact them for you.
            </p>
        </div>
    );

    if (submission) {
        return (
            <div
                role="status"
                aria-live="polite"
                className={`${textSizeClass} text-civic-ink`}
            >
                <div className="flex items-center gap-4">
                    <span
                        aria-hidden="true"
                        className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-civic-success text-2xl font-black text-white"
                    >
                        ✓
                    </span>
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-civic-success">
                        Report complete
                    </p>
                </div>
                <h1 className={`civic-display mt-6 ${headingClassName} text-civic-ink`}>
                    Housing repair reported
                </h1>
                <p className="mt-5 max-w-2xl text-civic-ink-soft">
                    Your report has been recorded. Make a note of the reference
                    below for your records.
                </p>
                <div className="mt-8 border-y-2 border-civic-success bg-civic-success-soft px-5 py-6 sm:px-7">
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-civic-success">
                        Repair reference
                    </p>
                    <p className="mt-2 break-all font-mono text-3xl font-black tracking-wide text-civic-ink sm:text-4xl">
                        {submission.reference}
                    </p>
                </div>
                {submission.deliveryStatus === "FAILED" && (
                    <div className="mt-6 border-l-8 border-civic-attention bg-civic-attention-soft px-5 py-4">
                        <p className="font-black">Delivery needs staff attention</p>
                        <p className="mt-1 text-civic-ink-soft">
                            Your case is safely recorded. Council staff can see
                            it in the Westbridge repair inbox and review the
                            failed delivery attempt.
                        </p>
                    </div>
                )}
                <a
                    href={`/repairs/${submission.caseId}`}
                    className="civic-button civic-button-secondary mt-7 min-h-12 px-5 py-3"
                >
                    View this repair
                </a>
            </div>
        );
    }

    if (isReviewing) {
        const hasOptionalNotes = Boolean(
            report.accessNotes?.trim() || report.additionalNotes?.trim(),
        );

        return (
            <div className={`${textSizeClass} text-civic-ink`}>
                {isStepByStep && (
                    <JourneyProgress
                        current={totalJourneySteps}
                        total={totalJourneySteps}
                    />
                )}

                <p className="mt-7 text-sm font-extrabold uppercase tracking-[0.18em] text-civic-accent-dark">
                    Final check
                </p>
                <h1 className={`civic-display mt-3 ${headingClassName} text-civic-ink`}>
                    Review your repair report
                </h1>

                {!isReducedClutter && (
                    <p className="mt-4 max-w-2xl text-civic-ink-soft">
                        Check the details below. You can go back and change
                        anything before submitting the report.
                    </p>
                )}

                <div className="mt-7 border-l-8 border-civic-attention bg-civic-attention-soft px-5 py-5 text-civic-ink">
                    <p className="text-lg font-black">
                        Nothing has been sent yet.
                    </p>
                    <p className="mt-1">
                        You must confirm at the end of this page before the
                        report is submitted.
                    </p>
                </div>

                {report.immediateDanger === true && dangerWarning}

                <section aria-labelledby="review-details-title" className="mt-10">
                    <h2
                        id="review-details-title"
                        className="civic-display border-b-2 border-civic-ink pb-3 text-2xl sm:text-3xl"
                    >
                        Repair details
                    </h2>
                    <dl>
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
                    </dl>
                </section>

                <section aria-labelledby="review-safety-title" className="mt-9">
                    <h2
                        id="review-safety-title"
                        className="civic-display border-b-2 border-civic-ink pb-3 text-2xl sm:text-3xl"
                    >
                        Safety check
                    </h2>
                    <dl>
                        <SummaryRow label="Getting worse">
                            {report.isGettingWorse ? "Yes" : "No"}
                        </SummaryRow>
                        <SummaryRow label="Immediate danger">
                            <span
                                className={
                                    report.immediateDanger
                                        ? "font-black text-civic-danger"
                                        : "font-black text-civic-success"
                                }
                            >
                                {report.immediateDanger ? "Yes" : "No"}
                            </span>
                        </SummaryRow>
                    </dl>
                </section>

                {hasOptionalNotes && (
                    <section aria-labelledby="review-notes-title" className="mt-9">
                        <h2
                            id="review-notes-title"
                            className="civic-display border-b-2 border-civic-ink pb-3 text-2xl sm:text-3xl"
                        >
                            Access and other details
                        </h2>
                        <dl>
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
                    </section>
                )}

                {selectedPhotos.length > 0 && (
                    <section aria-labelledby="review-photos-title" className="mt-9">
                        <h2
                            id="review-photos-title"
                            className="civic-display border-b-2 border-civic-ink pb-3 text-2xl sm:text-3xl"
                        >
                            Photographs
                        </h2>
                        <ul className="mt-4 list-disc space-y-2 pl-6">
                            {selectedPhotos.map((photo) => (
                                <li key={`${photo.name}-${photo.size}`}>
                                    {photo.name} ({Math.ceil(photo.size / 1024)} KB)
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {submitError && (
                    <p
                        role="alert"
                        className="mt-7 border-l-8 border-civic-danger bg-civic-danger-soft px-5 py-4 font-bold text-civic-danger"
                    >
                        {submitError}
                    </p>
                )}

                <section
                    aria-labelledby="confirm-report-title"
                    className="mt-10 border-t-4 border-civic-accent bg-civic-accent-soft px-5 py-6 sm:px-7 sm:py-7"
                >
                    <h2
                        id="confirm-report-title"
                        className="civic-display text-2xl text-civic-ink sm:text-3xl"
                    >
                        Ready to send?
                    </h2>
                    {!isReducedClutter && (
                        <p className="mt-2 max-w-xl text-civic-ink-soft">
                            Confirm only when you are satisfied that the report
                            above is accurate.
                        </p>
                    )}
                    <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={() => {
                                setSubmitError(null);
                                closeReview();
                            }}
                            className={secondaryButtonClassName}
                        >
                            Back and change answers
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className={primaryButtonClassName}
                        >
                            {isSubmitting
                                ? "Submitting securely…"
                                : "Confirm and submit"}
                        </button>
                    </div>
                </section>
            </div>
        );
    }

    const questions = (
        <>
            {!isStepByStep && (
                <SectionHeading
                    number="01"
                    title="About the repair"
                    description="Tell us where the problem is, what needs fixing and when it began."
                    showDescription={!isReducedClutter}
                />
            )}

            {showQuestion("address") && (
                <div className={questionClassName}>
                    <label htmlFor="housing-address" className={labelClassName}>
                        {isPlainLanguage
                            ? "What is your home address?"
                            : "What is the address of the property?"}
                    </label>
                    {!isReducedClutter && (
                        <p
                            id="housing-address-hint"
                            className="mt-2 text-sm leading-6 text-civic-ink-soft"
                        >
                            Enter the full address of the council property that
                            needs the repair.
                        </p>
                    )}
                    <input
                        id="housing-address"
                        type="text"
                        autoComplete="street-address"
                        aria-describedby={
                            isReducedClutter ? undefined : "housing-address-hint"
                        }
                        value={report.address}
                        onChange={(event) =>
                            setReport({
                                ...report,
                                address: event.target.value,
                            })
                        }
                        className={`${fieldClassName} max-w-2xl`}
                    />
                </div>
            )}

            {showQuestion("repairType") && (
                <fieldset
                    aria-describedby={
                        isReducedClutter ? undefined : "repair-type-hint"
                    }
                    className={questionClassName}
                >
                    <legend className={labelClassName}>
                        {isPlainLanguage
                            ? "What needs fixing?"
                            : "What type of repair is needed?"}
                    </legend>
                    {!isReducedClutter && (
                        <p
                            id="repair-type-hint"
                            className="mt-2 text-sm leading-6 text-civic-ink-soft"
                        >
                            Choose the option that best describes the problem.
                        </p>
                    )}
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {Object.entries(repairTypeLabels).map(([value, label]) => (
                            <label key={value} className={choiceLabelClassName}>
                                <input
                                    type="radio"
                                    name="repair-type"
                                    value={value}
                                    checked={report.repairType === value}
                                    onChange={() =>
                                        setReport({
                                            ...report,
                                            repairType: value as RepairType,
                                        })
                                    }
                                    className={radioClassName}
                                />
                                <span>{label}</span>
                                <span
                                    aria-hidden="true"
                                    className="civic-choice-selected"
                                >
                                    Selected
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>
            )}

            {showQuestion("issueDescription") && (
                <div className={questionClassName}>
                    <label htmlFor="issue-description" className={labelClassName}>
                        {isPlainLanguage
                            ? "Tell us what is wrong"
                            : "Describe the repair issue"}
                    </label>
                    {!isReducedClutter && (
                        <div
                            id="issue-description-hint"
                            className="mt-3 border-l-4 border-civic-accent bg-civic-accent-soft px-4 py-3 text-sm leading-6 text-civic-ink-soft"
                        >
                            <span className="font-black text-civic-accent-dark">
                                A useful example
                            </span>
                            <span className="block">
                                There is water leaking through my ceiling.
                            </span>
                        </div>
                    )}
                    <textarea
                        id="issue-description"
                        rows={7}
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
                        className={`${fieldClassName} max-w-2xl`}
                    />
                </div>
            )}

            {showQuestion("whenProblemStarted") && (
                <div className={questionClassName}>
                    <label htmlFor="problem-started" className={labelClassName}>
                        {isPlainLanguage
                            ? "When did you first notice the problem?"
                            : "When did the problem start?"}
                    </label>
                    {!isReducedClutter && (
                        <p
                            id="problem-started-hint"
                            className="mt-2 text-sm leading-6 text-civic-ink-soft"
                        >
                            Choose today or an earlier date.
                        </p>
                    )}
                    <input
                        id="problem-started"
                        type="date"
                        max={new Date().toLocaleDateString("en-CA")}
                        aria-describedby={
                            isReducedClutter ? undefined : "problem-started-hint"
                        }
                        value={report.whenProblemStarted}
                        onChange={(event) =>
                            setReport({
                                ...report,
                                whenProblemStarted: event.target.value,
                            })
                        }
                        className={`${fieldClassName} max-w-xs`}
                    />
                </div>
            )}

            {!isStepByStep && (
                <SectionHeading
                    number="02"
                    title="Safety check"
                    description="These answers help make the urgency and risk clear."
                    showDescription={!isReducedClutter}
                />
            )}

            {showQuestion("isGettingWorse") && (
                <fieldset className={questionClassName}>
                    <legend className={labelClassName}>
                        {isPlainLanguage
                            ? "Is the problem getting worse?"
                            : "Has the repair issue become worse over time?"}
                    </legend>
                    <div className="mt-4 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
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
                            <span>Yes</span>
                            <span
                                aria-hidden="true"
                                className="civic-choice-selected"
                            >
                                Selected
                            </span>
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
                            <span>No</span>
                            <span
                                aria-hidden="true"
                                className="civic-choice-selected"
                            >
                                Selected
                            </span>
                        </label>
                    </div>
                </fieldset>
            )}

            {showQuestion("immediateDanger") && (
                <fieldset
                    aria-labelledby="immediate-danger-label"
                    aria-describedby={
                        isReducedClutter ? undefined : "immediate-danger-hint"
                    }
                    className={`${questionClassName} ${
                        isStepByStep
                            ? ""
                            : "max-w-2xl border-l-4 border-civic-attention bg-civic-attention-soft px-5 py-5 sm:px-6"
                    }`}
                >
                    <div
                        id="immediate-danger-label"
                        className={labelClassName}
                    >
                        {isPlainLanguage
                            ? "Is anyone in danger right now?"
                            : "Does the issue present an immediate danger?"}
                    </div>

                    {!isReducedClutter && (
                        <p
                            id="immediate-danger-hint"
                            className="mt-2 max-w-xl text-sm leading-6 text-civic-ink-soft"
                        >
                            Consider risks such as exposed wiring, a collapsing ceiling,
                            flooding or loss of essential heating.
                        </p>
                    )}

                    <div className="mt-4 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
                        <label
                            className={`civic-choice-card font-bold ${
                                isLargeTarget
                                    ? "min-h-16 px-5 py-4"
                                    : "min-h-12 px-4 py-3"
                            }`}
                        >
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
                            <span>Yes</span>
                            <span
                                aria-hidden="true"
                                className="civic-choice-selected"
                            >
                    Selected
                </span>
                        </label>

                        <label
                            className={`civic-choice-card font-bold ${
                                isLargeTarget
                                    ? "min-h-16 px-5 py-4"
                                    : "min-h-12 px-4 py-3"
                            }`}
                        >
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
                            <span>No</span>
                            <span
                                aria-hidden="true"
                                className="civic-choice-selected"
                            >
                    Selected
                </span>
                        </label>
                    </div>

                    {report.immediateDanger === true && dangerWarning}
                </fieldset>
            )}

            {!isStepByStep && (
                <SectionHeading
                    number="03"
                    title="Access and other details"
                    description="Add anything that could help with access or understanding the repair."
                    showDescription={!isReducedClutter}
                />
            )}

            {showQuestion("accessNotes") && (
                <div className={questionClassName}>
                    <label htmlFor="access-notes" className={labelClassName}>
                        {isPlainLanguage
                            ? "Is there anything we need to know to get into your home?"
                            : "Are there any access instructions?"}{" "}
                        <span className="font-normal text-civic-ink-soft">
                            (optional)
                        </span>
                    </label>
                    {!isReducedClutter && (
                        <p
                            id="access-notes-hint"
                            className="mt-2 text-sm leading-6 text-civic-ink-soft"
                        >
                            For example, tell us about an entry phone, gate or
                            preferred entrance.
                        </p>
                    )}
                    <textarea
                        id="access-notes"
                        rows={4}
                        aria-describedby={
                            isReducedClutter ? undefined : "access-notes-hint"
                        }
                        value={report.accessNotes ?? ""}
                        onChange={(event) =>
                            setReport({
                                ...report,
                                accessNotes: event.target.value,
                            })
                        }
                        className={`${fieldClassName} max-w-2xl`}
                    />
                </div>
            )}

            {!isReducedClutter && showQuestion("additionalNotes") && (
                <div className={questionClassName}>
                    <label htmlFor="additional-notes" className={labelClassName}>
                        {isPlainLanguage
                            ? "Anything else you want to tell us?"
                            : "Additional information"}{" "}
                        <span className="font-normal text-civic-ink-soft">
                            (optional)
                        </span>
                    </label>
                    <textarea
                        id="additional-notes"
                        rows={4}
                        value={report.additionalNotes ?? ""}
                        onChange={(event) =>
                            setReport({
                                ...report,
                                additionalNotes: event.target.value,
                            })
                        }
                        className={`${fieldClassName} max-w-2xl`}
                    />
                </div>
            )}

            {showQuestion("photos") && (
                <div className={questionClassName}>
                    <label htmlFor="repair-photos" className={labelClassName}>
                        {isPlainLanguage
                            ? "Do you want to add photos of the problem?"
                            : "Repair photographs"}{" "}
                        <span className="font-normal text-civic-ink-soft">
                            (optional)
                        </span>
                    </label>
                    {!isReducedClutter && (
                        <p
                            id="repair-photos-hint"
                            className="mt-2 max-w-2xl text-sm leading-6 text-civic-ink-soft"
                        >
                            Add up to 5 JPEG, PNG or WebP images. Each image can
                            be up to 5 MB. Do not include documents or SVG files.
                        </p>
                    )}
                    <input
                        id="repair-photos"
                        name="repair-photos"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        aria-describedby={
                            isReducedClutter ? undefined : "repair-photos-hint"
                        }
                        onChange={(event) => {
                            const files = Array.from(event.target.files ?? []);

                            if (files.length > 5) {
                                setStepError(
                                    "Attach no more than 5 photographs.",
                                );
                                event.target.value = "";
                                setSelectedPhotos([]);
                                return;
                            }

                            setStepError(null);
                            setSelectedPhotos(files);
                        }}
                        className={`${fieldClassName} max-w-2xl file:mr-4 file:border-0 file:bg-civic-accent-soft file:px-4 file:py-2 file:font-bold file:text-civic-accent-dark`}
                    />
                    {selectedPhotos.length > 0 && (
                        <p className="mt-3 font-bold text-civic-ink-soft">
                            {selectedPhotos.length} photograph
                            {selectedPhotos.length === 1 ? "" : "s"} selected
                        </p>
                    )}
                </div>
            )}
        </>
    );

    return (
        <form onSubmit={handleReview} className={`${textSizeClass} text-civic-ink`}>
            <header className="border-b border-civic-line pb-8">
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-civic-accent-dark">
                    Council housing service
                </p>
                <h1 className={`civic-display mt-3 ${headingClassName} text-civic-ink`}>
                    Report a housing repair
                </h1>

                {!isReducedClutter && (
                    <p className="mt-5 max-w-2xl text-civic-ink-soft">
                        Tell us about a repair needed at your council property.
                    </p>
                )}
                <p className="mt-2 max-w-2xl font-bold text-civic-ink">
                    You’ll check your answers before anything is sent.
                </p>
            </header>

            {isStepByStep ? (
                <>
                    <JourneyProgress
                        current={activeStepIndex + 1}
                        total={totalJourneySteps}
                    />
                    <div className="mt-7 min-h-[21rem] border-l-4 border-civic-accent bg-civic-paper px-5 py-7 sm:px-8 sm:py-9">
                        {questions}
                    </div>
                </>
            ) : (
                questions
            )}

            {stepError && (
                <p
                    id="housing-repair-error"
                    role="alert"
                    className="mt-7 border-l-8 border-civic-danger bg-civic-danger-soft px-5 py-4 font-bold text-civic-danger"
                >
                    {stepError}
                </p>
            )}

            {isStepByStep ? (
                <div className="mt-7 flex flex-col-reverse items-stretch gap-3 border-t border-civic-line pt-6 sm:flex-row sm:items-center">
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
                            : "Next question"}
                    </button>
                </div>
            ) : (
                <div className="mt-10 border-t-2 border-civic-ink pt-7">
                    <button type="submit" className={primaryButtonClassName}>
                        Review repair report
                    </button>
                </div>
            )}
        </form>
    );
}
