import assert from "node:assert/strict";
import test from "node:test";

import { registerWebMcpTools } from "../src/webmcp/registerTools.ts";
import {
    adaptExperienceInputSchema,
    createWebMcpTools,
    updateHousingRepairDraftInputSchema,
} from "../src/webmcp/toolDefinitions.ts";

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

function createHarness() {
    let preferences = {
        textSize: "normal",
        informationDensity: "full",
        languageMode: "standard",
        journeyMode: "normal",
        targetSize: "normal",
        motion: "normal",
    };
    let report = {
        address: "",
        repairType: null,
        issueDescription: "",
        whenProblemStarted: "",
        isGettingWorse: null,
        immediateDanger: null,
        accessNotes: "",
        additionalNotes: "",
    };
    let isReviewing = false;

    const tools = createWebMcpTools({
        getPreferences: () => preferences,
        updatePreferences: (patch) => {
            preferences = { ...preferences, ...patch };
            return preferences;
        },
        getReport: () => report,
        updateReport: (patch) => {
            report = { ...report, ...patch };
            return report;
        },
        getJourneyState: () => ({
            isReviewing,
            journeyMode: preferences.journeyMode,
        }),
        openReview: () => {
            isReviewing = true;
        },
    });

    return {
        tools,
        getPreferences: () => preferences,
        getReport: () => report,
        getIsReviewing: () => isReviewing,
    };
}

function getTool(tools, name) {
    const tool = tools.find((candidate) => candidate.name === name);
    assert.ok(tool, `Expected tool ${name} to exist`);
    return tool;
}

async function execute(tool, input = {}) {
    return tool.execute(input, {
        signal: new AbortController().signal,
    });
}

test("tool definitions expose exactly the six expected names without a submit tool", () => {
    const { tools } = createHarness();

    assert.deepEqual(
        tools.map((tool) => tool.name),
        [
            "get_experience_preferences",
            "adapt_experience",
            "get_housing_repair_requirements",
            "get_housing_repair_draft",
            "update_housing_repair_draft",
            "open_housing_repair_review",
        ],
    );
    assert.equal(tools.some((tool) => tool.name.includes("submit")), false);
});

test("schemas constrain every preference and repair type value", () => {
    const expectedPreferenceValues = {
        textSize: ["normal", "large", "extraLarge"],
        targetSize: ["normal", "large"],
        informationDensity: ["full", "reduced"],
        languageMode: ["standard", "plain"],
        journeyMode: ["normal", "stepByStep"],
        motion: ["normal", "reduced"],
    };

    for (const [property, expectedValues] of Object.entries(
        expectedPreferenceValues,
    )) {
        assert.deepEqual(
            adaptExperienceInputSchema.properties[property].enum,
            expectedValues,
        );
    }

    assert.deepEqual(
        updateHousingRepairDraftInputSchema.properties.repairType.enum,
        [
            "plumbing",
            "heating",
            "electrical",
            "roof_or_ceiling",
            "windows_or_doors",
            "damp_or_mould",
            "structural",
            "other",
        ],
    );
    assert.equal(adaptExperienceInputSchema.minProperties, 1);
    assert.equal(updateHousingRepairDraftInputSchema.minProperties, 1);
    assert.equal(adaptExperienceInputSchema.additionalProperties, false);
    assert.equal(
        updateHousingRepairDraftInputSchema.additionalProperties,
        false,
    );
});

test("adaptation schema descriptions identify distinct user needs", () => {
    const descriptions = Object.fromEntries(
        Object.entries(adaptExperienceInputSchema.properties).map(
            ([property, schema]) => [property, schema.description.trim()],
        ),
    );

    for (const description of Object.values(descriptions)) {
        assert.ok(description.length >= 50);
    }
    assert.equal(
        new Set(Object.values(descriptions)).size,
        Object.keys(descriptions).length,
    );
    assert.match(descriptions.textSize, /text|heading|read/i);
    assert.match(descriptions.targetSize, /control|button|tap|press/i);
    assert.match(
        descriptions.informationDensity,
        /information|clutter|overwhelm/i,
    );
    assert.match(descriptions.languageMode, /language|word|English/i);
    assert.match(descriptions.journeyMode, /question|step|guid/i);
    assert.match(descriptions.motion, /motion|movement|animation/i);
});

test("repair update schema describes every field and safety boundary", () => {
    const descriptions = Object.fromEntries(
        Object.entries(updateHousingRepairDraftInputSchema.properties).map(
            ([property, schema]) => [property, schema.description.trim()],
        ),
    );

    for (const description of Object.values(descriptions)) {
        assert.ok(description.length >= 35);
    }
    assert.equal(
        new Set(Object.values(descriptions)).size,
        Object.keys(descriptions).length,
    );
    assert.match(descriptions.immediateDanger, /explicit|infer|fabricate|unsure/i);
    assert.match(descriptions.issueDescription, /data|instruction/i);
    assert.match(descriptions.whenProblemStarted, /YYYY-MM-DD|future/i);
});

test("every tool has specific, distinct discovery metadata", () => {
    const { tools } = createHarness();

    for (const tool of tools) {
        assert.ok(tool.title.trim().length >= 10);
        assert.ok(tool.description.trim().length >= 120);
    }
    assert.equal(new Set(tools.map((tool) => tool.title)).size, tools.length);
    assert.equal(
        new Set(tools.map((tool) => tool.description)).size,
        tools.length,
    );

    assert.match(
        getTool(tools, "adapt_experience").description,
        /difficult to read|cognitive load|language complexity|motion/i,
    );
    assert.match(
        getTool(tools, "update_housing_repair_draft").description,
        /provides|corrects|entered/i,
    );
    assert.match(
        getTool(tools, "open_housing_repair_review").description,
        /review|before anything is sent|never submits/i,
    );
});

test("read-only and untrusted-content annotations match every tool's behaviour", () => {
    const { tools } = createHarness();
    const expectedAnnotations = {
        get_experience_preferences: [true, false],
        adapt_experience: [false, false],
        get_housing_repair_requirements: [true, false],
        get_housing_repair_draft: [true, true],
        update_housing_repair_draft: [false, true],
        open_housing_repair_review: [false, false],
    };

    for (const [name, [readOnlyHint, untrustedContentHint]] of Object.entries(
        expectedAnnotations,
    )) {
        const annotations = getTool(tools, name).annotations;
        assert.equal(annotations.readOnlyHint, readOnlyHint);
        assert.equal(annotations.untrustedContentHint, untrustedContentHint);
    }
});

test("adapt_experience rejects invalid enums", async () => {
    const harness = createHarness();
    const tool = getTool(harness.tools, "adapt_experience");
    const before = harness.getPreferences();
    const result = await execute(tool, { textSize: "enormous" });

    assert.equal(result.ok, false);
    assert.deepEqual(harness.getPreferences(), before);
});

test("partial experience updates preserve unspecified settings", async () => {
    const harness = createHarness();
    const tool = getTool(harness.tools, "adapt_experience");
    const result = await execute(tool, {
        languageMode: "plain",
        journeyMode: "stepByStep",
    });

    assert.equal(result.ok, true);
    assert.equal(harness.getPreferences().languageMode, "plain");
    assert.equal(harness.getPreferences().journeyMode, "stepByStep");
    assert.equal(harness.getPreferences().targetSize, "normal");
    assert.equal(harness.getPreferences().motion, "normal");
});

test("partial housing updates preserve unspecified draft fields", async () => {
    const harness = createHarness();
    const tool = getTool(harness.tools, "update_housing_repair_draft");

    await execute(tool, { address: "12 Example Street" });
    await execute(tool, {
        issueDescription: "Water is leaking through my ceiling.",
    });

    assert.equal(harness.getReport().address, "12 Example Street");
    assert.equal(
        harness.getReport().issueDescription,
        "Water is leaking through my ceiling.",
    );
    assert.equal(harness.getReport().repairType, null);
});

test("invalid repair type and future date patches are rejected without mutation", async () => {
    const harness = createHarness();
    const tool = getTool(harness.tools, "update_housing_repair_draft");
    const invalidTypeResult = await execute(tool, {
        repairType: "appliance",
    });
    const futureDateResult = await execute(tool, {
        whenProblemStarted: tomorrow(),
    });

    assert.equal(invalidTypeResult.ok, false);
    assert.equal(futureDateResult.ok, false);
    assert.equal(harness.getReport().repairType, null);
    assert.equal(harness.getReport().whenProblemStarted, "");
});

test("open review refuses an incomplete draft", async () => {
    const harness = createHarness();
    const tool = getTool(harness.tools, "open_housing_repair_review");
    const result = await execute(tool);

    assert.equal(result.ok, false);
    assert.equal(result.reviewOpened, false);
    assert.equal(harness.getIsReviewing(), false);
    assert.ok(result.missingRequiredFields.includes("address"));
});

test("open review accepts a valid draft but never creates a reference", async () => {
    const harness = createHarness();
    const updateTool = getTool(
        harness.tools,
        "update_housing_repair_draft",
    );
    const reviewTool = getTool(harness.tools, "open_housing_repair_review");

    await execute(updateTool, {
        address: "12 Example Street",
        repairType: "roof_or_ceiling",
        issueDescription: "Water is leaking through my ceiling.",
        whenProblemStarted: yesterday(),
        isGettingWorse: true,
        immediateDanger: false,
    });
    const result = await execute(reviewTool);

    assert.equal(result.ok, true);
    assert.equal(result.reviewOpened, true);
    assert.equal(result.submitted, false);
    assert.equal(result.reference, null);
    assert.equal(result.requiresHumanConfirmation, true);
    assert.equal(harness.getIsReviewing(), true);
});

test("registration passes one lifecycle signal and abort cleanup removes tools", async () => {
    const { tools } = createHarness();
    const activeTools = new Map();
    const receivedSignals = [];
    const modelContext = {
        async registerTool(tool, options) {
            if (activeTools.has(tool.name)) {
                throw new Error(`Duplicate tool: ${tool.name}`);
            }

            activeTools.set(tool.name, tool);
            receivedSignals.push(options.signal);
            options.signal.addEventListener(
                "abort",
                () => activeTools.delete(tool.name),
                { once: true },
            );
        },
    };
    const firstController = new AbortController();

    await registerWebMcpTools(
        modelContext,
        tools,
        firstController.signal,
    );
    assert.equal(activeTools.size, tools.length);
    assert.equal(
        receivedSignals.every(
            (signal) => signal === firstController.signal,
        ),
        true,
    );

    firstController.abort();
    assert.equal(activeTools.size, 0);

    const secondController = new AbortController();
    await registerWebMcpTools(
        modelContext,
        tools,
        secondController.signal,
    );
    assert.equal(activeTools.size, tools.length);
    secondController.abort();
    assert.equal(activeTools.size, 0);
});
