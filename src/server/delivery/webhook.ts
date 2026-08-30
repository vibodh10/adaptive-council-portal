import { createHmac } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import type {
    CouncilDeliveryAdapter,
    DeliveryCase,
    DeliveryOutcome,
} from "@/server/delivery/types";
import { serviceError } from "@/server/security/serviceError";

function isDisallowedIpv4(address: string): boolean {
    const parts = address.split(".").map(Number);

    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
        return true;
    }

    const [a, b, c] = parts;
    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 192 && b === 0) ||
        (a === 192 && b === 0 && c === 2) ||
        (a === 198 && (b === 18 || b === 19)) ||
        (a === 198 && b === 51 && c === 100) ||
        (a === 203 && b === 0 && c === 113) ||
        a >= 224
    );
}

function isDisallowedIpv6(address: string): boolean {
    const normalized = address.toLowerCase();

    if (normalized.startsWith("::ffff:")) {
        return isDisallowedIpv4(normalized.slice("::ffff:".length));
    }

    return (
        normalized === "::" ||
        normalized === "::1" ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        /^fe[89ab]/.test(normalized) ||
        normalized.startsWith("2001:db8:")
    );
}

export function isDisallowedNetworkAddress(address: string): boolean {
    const version = isIP(address);
    return version === 4
        ? isDisallowedIpv4(address)
        : version === 6
            ? isDisallowedIpv6(address)
            : true;
}

export function validateWebhookUrl(value: string): URL {
    let url: URL;

    try {
        url = new URL(value);
    } catch {
        throw serviceError(
            "DELIVERY_CONFIGURATION_INVALID",
            503,
            "The council delivery endpoint is not configured correctly.",
        );
    }

    const hostname = url.hostname.toLowerCase();

    if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.port ||
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname.endsWith(".local") ||
        hostname.endsWith(".internal") ||
        (isIP(hostname) !== 0 && isDisallowedNetworkAddress(hostname))
    ) {
        throw serviceError(
            "DELIVERY_CONFIGURATION_INVALID",
            503,
            "The council delivery endpoint is not configured correctly.",
        );
    }

    return url;
}

async function assertPublicDnsTarget(url: URL): Promise<void> {
    const addresses = await lookup(url.hostname, { all: true });

    if (
        addresses.length === 0 ||
        addresses.some(({ address }) => isDisallowedNetworkAddress(address))
    ) {
        throw serviceError(
            "DELIVERY_CONFIGURATION_INVALID",
            503,
            "The council delivery endpoint is not configured correctly.",
        );
    }
}

function normalizedPayload(repairCase: DeliveryCase) {
    return {
        schemaVersion: "1.0",
        service: "housing-repair",
        reference: repairCase.reference,
        submittedAt: repairCase.submittedAt,
        repair: {
            address: repairCase.address,
            repairType: repairCase.repairType,
            issueDescription: repairCase.issueDescription,
            whenProblemStarted: repairCase.whenProblemStarted,
            isGettingWorse: repairCase.isGettingWorse,
            immediateDanger: repairCase.immediateDanger,
            accessNotes: repairCase.accessNotes ?? "",
            additionalNotes: repairCase.additionalNotes ?? "",
            attachmentCount: repairCase.attachmentCount,
        },
    };
}

export function createWebhookAdapter(input: {
    endpoint: string;
    secret: string;
    fetchImplementation?: typeof fetch;
}): CouncilDeliveryAdapter {
    const endpoint = validateWebhookUrl(input.endpoint);
    const secret = input.secret;
    const fetchImplementation = input.fetchImplementation ?? fetch;

    if (secret.length < 32) {
        throw serviceError(
            "DELIVERY_CONFIGURATION_INVALID",
            503,
            "The council delivery endpoint is not configured correctly.",
        );
    }

    return {
        adapterType: "WEBHOOK",
        async deliver(repairCase): Promise<DeliveryOutcome> {
            try {
                await assertPublicDnsTarget(endpoint);
                const body = JSON.stringify(normalizedPayload(repairCase));
                const signature = createHmac("sha256", secret)
                    .update(body)
                    .digest("hex");
                const response = await fetchImplementation(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Necivia-Signature": `sha256=${signature}`,
                        "X-Necivia-Reference": repairCase.reference,
                    },
                    body,
                    redirect: "error",
                    signal: AbortSignal.timeout(5_000),
                });

                return {
                    adapterType: "WEBHOOK",
                    succeeded: response.ok,
                    safeMetadata: {
                        statusCode: response.status,
                        requestId:
                            response.headers.get("x-request-id")?.slice(0, 100) ??
                            null,
                    },
                };
            } catch {
                return {
                    adapterType: "WEBHOOK",
                    succeeded: false,
                    safeMetadata: {
                        failure: "delivery-request-failed",
                    },
                };
            }
        },
    };
}
