"use client";

import React, { useState } from "react";
import type { MissedBinReport, BinType } from "@/types/missedBin";
import { submitMissedBinReport } from "@/lib/submitMissedBinReport";
import {useExperience} from "@/features/experience/ExperienceProvider";

export default function MissedBinForm() {
    const { preferences } = useExperience();

    const textSizeClass =
        preferences.textSize === "extraLarge"
            ? "text-xl"
            : preferences.textSize === "large"
                ? "text-lg"
                : "text-base";
    const isLargeTarget = preferences.targetSize === "large";
    const fieldClassName = `mt-2 block w-full max-w-md rounded-md border border-slate-400 bg-white text-slate-950 shadow-sm transition-colors hover:border-slate-500 focus:border-[#075e68] focus:outline-none focus:ring-4 focus:ring-[#075e68]/20 ${
        isLargeTarget ? "min-h-12 px-4 py-3" : "px-3 py-2"
    }`;
    const buttonSizeClassName = isLargeTarget
        ? "min-h-12 px-6 py-3"
        : "px-4 py-2";
    const checkboxSizeClassName = `${isLargeTarget
        ? "h-8 w-8"
        : "h-5 w-5"
    } shrink-0 accent-[#075e68]`;
    const primaryButtonClassName = `rounded-md bg-[#075e68] font-semibold text-white shadow-sm transition-colors hover:bg-[#054951] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${buttonSizeClassName}`;
    const secondaryButtonClassName = `rounded-md border border-slate-400 bg-white font-semibold text-[#173b57] shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${buttonSizeClassName}`;
    const isStepByStep = preferences.journeyMode === "stepByStep";
    const showStep = (step: number) =>
        !isStepByStep || currentStep === step;
    const [stepError, setStepError] = useState<string | null>(null);

    const isPlainLanguage = preferences.languageMode === "plain";
    const [currentStep, setCurrentStep] = useState(0);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const [report, setReport] = useState<MissedBinReport>({
        address: "",
        binType: "general",
        expectedCollectionDate: "",
        neighboursAlsoMissed: false,
        notes: "",
    });

    const [reference, setReference] = useState<string | null>(null);

    function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setSubmitError(null);

        try {
            const result = submitMissedBinReport(report);
            setReference(result.reference);
        } catch (error) {
            setReference(null);

            if (error instanceof Error) {
                setSubmitError(error.message);
            } else {
                setSubmitError("Something went wrong while submitting the report.");
            }
        }
    }

    function handleNext() {
        setStepError(null);

        if (currentStep === 0 && !report.address.trim()) {
            setStepError("Please enter your address.");
            return;
        }

        if (currentStep === 2) {
            if (!report.expectedCollectionDate) {
                setStepError("Please choose the collection date.");
                return;
            }

            const selectedDate = new Date(
                `${report.expectedCollectionDate}T00:00:00`,
            );

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate > today) {
                setStepError("The collection date cannot be in the future.");
                return;
            }
        }

        setCurrentStep(currentStep + 1);
    }

    return (
        <form
            onSubmit={handleSubmit}
            className={`${textSizeClass} text-slate-800`}
        >
            <h1
                className={
                    preferences.textSize === "extraLarge"
                            ? "text-4xl font-bold tracking-tight text-slate-950"
                            : preferences.textSize === "large"
                            ? "text-3xl font-bold tracking-tight text-slate-950"
                            : "text-2xl font-bold tracking-tight text-slate-950"
                }
            >
                Report a missed bin
            </h1>

            {isStepByStep && (
                <p className="mt-3 inline-flex rounded-full bg-[#e7f3f4] px-3 py-1 font-semibold text-[#075e68]">
                    Step {currentStep + 1} of 5
                </p>
            )}

            {showStep(0) && (
                <div className="mt-7">
                    <label htmlFor="address" className="block font-semibold text-slate-950">
                        Address
                    </label>

                    <input
                        id="address"
                        type="text"
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

            {showStep(1) && (
                <div className="mt-7">
                    <label htmlFor="binType" className="block font-semibold text-slate-950">
                        {isPlainLanguage
                            ? "Which bin did the council not collect?"
                            : "Which bin was missed?"}
                    </label>

                    <select
                        id="binType"
                        value={report.binType}
                        onChange={(event) =>
                            setReport({
                                ...report,
                                binType: event.target.value as BinType
                            })
                        }
                        className={fieldClassName}
                    >
                        <option value="general">General waste</option>
                        <option value="recycling">Recycling</option>
                        <option value="garden">Garden waste</option>
                    </select>
                </div>
            )}

            {showStep(2) &&(
                <div className="mt-7">
                    <label htmlFor="expectedCollectionDate" className="block font-semibold text-slate-950">
                        {isPlainLanguage
                            ? "What day was your bin supposed to be collected?"
                            : "When should your bin have been collected?"}
                    </label>

                    <input
                        id="expectedCollectionDate"
                        type="date"
                        value={report.expectedCollectionDate}
                        max={new Date().toLocaleDateString("en-CA")}
                        onChange={(event) =>
                            setReport({
                                ...report,
                                expectedCollectionDate: event.target.value,
                            })
                        }
                        className={fieldClassName}
                    />
                </div>
            )}

            {showStep(3) && (
                <div className="mt-7">
                    <label className="flex cursor-pointer items-center gap-3 font-medium text-slate-950">
                        <input
                            type="checkbox"
                            checked={report.neighboursAlsoMissed}
                            onChange={(event) =>
                                setReport({
                                    ...report,
                                    neighboursAlsoMissed: event.target.checked,
                                })
                            }
                            className={checkboxSizeClassName}
                        />

                        <span>{isPlainLanguage
                            ? "Did the council also miss your neighbours' bins?"
                            : "Were your neighbours' bins missed too?"}</span>
                    </label>
                </div>
            )}

            {preferences.informationDensity === "full" && showStep(4) && (
                <div className="mt-7">
                    <label htmlFor="notes" className="block font-semibold text-slate-950">
                        Anything else we should know?{" "}
                        <span className="font-normal">(optional)</span>
                    </label>

                    <textarea
                        id="notes"
                        value={report.notes ?? ""}
                        onChange={(event) =>
                            setReport({
                                ...report,
                                notes: event.target.value,
                            })
                        }
                        rows={4}
                        className={fieldClassName}
                    />
                </div>
            )}

            {stepError && (
                <p className="mt-5 rounded-md border-l-4 border-red-700 bg-red-50 px-4 py-3 font-semibold text-red-800">
                    {stepError}
                </p>
            )}

            {isStepByStep && (
                <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
                    {currentStep > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setStepError(null);
                                setCurrentStep(currentStep - 1);
                            }}
                            className={secondaryButtonClassName}
                        >
                            Back
                        </button>
                    )}

                    {currentStep < 4 && (
                        <button
                            type="button"
                            onClick={handleNext}
                            className={primaryButtonClassName}
                        >
                            Next
                        </button>
                    )}
                </div>
            )}

            {submitError && (
                <p className="mt-5 rounded-md border-l-4 border-red-700 bg-red-50 px-4 py-3 font-semibold text-red-800">
                    {submitError}
                </p>
            )}

            {(!isStepByStep || currentStep === 4) && (
                <button
                    type="submit"
                    className={`mt-7 ${primaryButtonClassName}`}
                >
                    Submit report
                </button>
            )}

            {reference && (
                <p className="mt-5 rounded-md border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 font-semibold text-emerald-900">
                    Report submitted. Your reference is {reference}.
                </p>
            )}
        </form>
    )
}
