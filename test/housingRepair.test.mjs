import assert from "node:assert/strict";
import test from "node:test";

import {
    getHousingRepairValidationIssues,
    submitHousingRepairReport,
    validateHousingRepairReport,
} from "../src/lib/submitHousingRepairReport.ts";

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function yesterday() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return formatLocalDate(date);
}

function tomorrow() {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return formatLocalDate(date);
}

function validReport(overrides = {}) {
    return {
        address: "12 Example Street",
        repairType: "roof_or_ceiling",
        issueDescription: "There is water leaking through my ceiling.",
        whenProblemStarted: yesterday(),
        isGettingWorse: false,
        immediateDanger: false,
        accessNotes: "Use the side entrance.",
        additionalNotes: "",
        ...overrides,
    };
}

test("a valid housing repair passes shared domain validation", () => {
    const report = validReport();

    assert.doesNotThrow(() => validateHousingRepairReport(report));

    const result = submitHousingRepairReport(report);
    assert.equal(result.success, true);
    assert.equal("reference" in result, false);
});

test("a blank address fails", () => {
    assert.throws(
        () => validateHousingRepairReport(validReport({ address: "  " })),
        /Address is required/,
    );
});

test("an invalid repair type fails", () => {
    assert.throws(
        () =>
            validateHousingRepairReport(
                validReport({ repairType: "not_a_repair_type" }),
            ),
        /valid repair type/,
    );
});

test("a blank issue description fails", () => {
    assert.throws(
        () =>
            validateHousingRepairReport(
                validReport({ issueDescription: "" }),
            ),
        /Issue description is required/,
    );
});

test("a blank problem-start date fails", () => {
    assert.throws(
        () =>
            validateHousingRepairReport(
                validReport({ whenProblemStarted: "" }),
            ),
        /date the problem started is required/,
    );
});

test("a malformed calendar date fails", () => {
    assert.throws(
        () =>
            validateHousingRepairReport(
                validReport({ whenProblemStarted: "2026-02-31" }),
            ),
        /valid date/,
    );
});

test("a future problem-start date fails", () => {
    assert.throws(
        () =>
            validateHousingRepairReport(
                validReport({ whenProblemStarted: tomorrow() }),
            ),
        /cannot be in the future/,
    );
});

test("an unanswered isGettingWorse safety question fails", () => {
    assert.throws(
        () =>
            validateHousingRepairReport(
                validReport({ isGettingWorse: null }),
            ),
        /problem is getting worse/,
    );
});

test("an unanswered immediateDanger safety question fails", () => {
    assert.throws(
        () =>
            validateHousingRepairReport(
                validReport({ immediateDanger: null }),
            ),
        /immediate danger/,
    );
});

test("explicit false safety answers are valid", () => {
    const issues = getHousingRepairValidationIssues(
        validReport({ isGettingWorse: false, immediateDanger: false }),
    );

    assert.deepEqual(issues, []);
});
