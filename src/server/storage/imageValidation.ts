import { extname } from "node:path";

import { serviceError } from "@/server/security/serviceError";

export const MAX_IMAGE_COUNT = 5;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_TOTAL_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;

export type ImageMimeType = "image/jpeg" | "image/png" | "image/webp";

export type UploadCandidate = {
    originalFilename: string;
    declaredMimeType: string;
    bytes: Uint8Array;
};

export type ValidatedImageUpload = {
    originalFilename: string;
    mimeType: ImageMimeType;
    extension: "jpg" | "png" | "webp";
    size: number;
    bytes: Uint8Array;
};

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
    return signature.every((value, index) => bytes[index] === value);
}

function detectImageType(
    bytes: Uint8Array,
): Pick<ValidatedImageUpload, "mimeType" | "extension"> | null {
    if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
        return { mimeType: "image/jpeg", extension: "jpg" };
    }

    if (
        startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    ) {
        return { mimeType: "image/png", extension: "png" };
    }

    const webp =
        startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50;

    return webp ? { mimeType: "image/webp", extension: "webp" } : null;
}

export function sanitizeFilename(filename: string): string {
    const withoutPath = filename.replaceAll("\\", "/").split("/").pop() ?? "image";
    const extension = extname(withoutPath);
    const stem = withoutPath.slice(0, Math.max(0, withoutPath.length - extension.length));
    const safeStem = stem
        .normalize("NFKC")
        .replace(/[^a-zA-Z0-9._ -]/g, "-")
        .replace(/\s+/g, " ")
        .replace(/\.{2,}/g, ".")
        .trim()
        .slice(0, 100);

    return `${safeStem || "repair-photo"}${extension.toLowerCase()}`.slice(
        0,
        120,
    );
}

export function validateImageUploads(
    candidates: readonly UploadCandidate[],
): ValidatedImageUpload[] {
    if (candidates.length > MAX_IMAGE_COUNT) {
        throw serviceError(
            "UPLOAD_INVALID",
            400,
            `Attach no more than ${MAX_IMAGE_COUNT} photographs.`,
        );
    }

    const totalSize = candidates.reduce(
        (sum, candidate) => sum + candidate.bytes.byteLength,
        0,
    );

    if (totalSize > MAX_TOTAL_IMAGE_SIZE_BYTES) {
        throw serviceError(
            "UPLOAD_INVALID",
            400,
            "The combined photograph size must not exceed 25 MB.",
        );
    }

    return candidates.map((candidate) => {
        if (
            candidate.bytes.byteLength === 0 ||
            candidate.bytes.byteLength > MAX_IMAGE_SIZE_BYTES
        ) {
            throw serviceError(
                "UPLOAD_INVALID",
                400,
                "Each photograph must be a non-empty image no larger than 5 MB.",
            );
        }

        const detected = detectImageType(candidate.bytes);

        if (!detected || detected.mimeType !== candidate.declaredMimeType) {
            throw serviceError(
                "UPLOAD_INVALID",
                400,
                "Photographs must be genuine JPEG, PNG or WebP images.",
            );
        }

        return {
            originalFilename: sanitizeFilename(candidate.originalFilename),
            mimeType: detected.mimeType,
            extension: detected.extension,
            size: candidate.bytes.byteLength,
            bytes: candidate.bytes,
        };
    });
}
