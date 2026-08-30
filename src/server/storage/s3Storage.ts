import { randomUUID } from "node:crypto";

import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";

import { serviceError } from "@/server/security/serviceError";
import type {
    PrivateAttachmentStorage,
    StorageObject,
    StoredAttachment,
} from "@/server/storage/storage";

const requiredStorageVariables = [
    "S3_BUCKET",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_REGION",
    "S3_ENDPOINT",
] as const;

type StorageConfig = {
    bucket: string;
    client: S3Client;
};

let cachedStorageConfig: StorageConfig | null = null;

function getStorageConfig(): StorageConfig {
    if (cachedStorageConfig) {
        return cachedStorageConfig;
    }

    for (const name of requiredStorageVariables) {
        if (!process.env[name]?.trim()) {
            throw serviceError(
                "STORAGE_UNAVAILABLE",
                503,
                "Photograph storage is temporarily unavailable.",
            );
        }
    }

    const endpoint = new URL(process.env.S3_ENDPOINT!);

    if (endpoint.protocol !== "https:" && process.env.NODE_ENV === "production") {
        throw serviceError(
            "STORAGE_UNAVAILABLE",
            503,
            "Photograph storage is temporarily unavailable.",
        );
    }

    cachedStorageConfig = {
        bucket: process.env.S3_BUCKET!,
        client: new S3Client({
            endpoint: endpoint.toString(),
            region: process.env.S3_REGION!,
            forcePathStyle: true,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID!,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
            },
        }),
    };

    return cachedStorageConfig;
}

function assertObjectKey(objectKey: string): void {
    if (
        objectKey.startsWith("/") ||
        objectKey.includes("..") ||
        !/^[a-zA-Z0-9/_-]+\.(jpg|png|webp)$/.test(objectKey)
    ) {
        throw serviceError(
            "NOT_FOUND",
            404,
            "The requested attachment was not found.",
        );
    }
}

export const s3AttachmentStorage: PrivateAttachmentStorage = {
    async putRepairImage({ councilId, residentId, caseId, image }) {
        const { bucket, client } = getStorageConfig();
        const objectKey = `${councilId}/${residentId}/${caseId}/${randomUUID()}.${image.extension}`;

        await client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: objectKey,
                Body: image.bytes,
                ContentType: image.mimeType,
                ContentLength: image.size,
                Metadata: {
                    purpose: "housing-repair",
                },
            }),
        );

        return {
            objectKey,
            originalFilename: image.originalFilename,
            mimeType: image.mimeType,
            size: image.size,
        } satisfies StoredAttachment;
    },

    async deleteObject(objectKey) {
        assertObjectKey(objectKey);
        const { bucket, client } = getStorageConfig();
        await client.send(
            new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }),
        );
    },

    async getObject(objectKey) {
        assertObjectKey(objectKey);
        const { bucket, client } = getStorageConfig();
        const response = await client.send(
            new GetObjectCommand({ Bucket: bucket, Key: objectKey }),
        );

        if (!response.Body || !response.ContentType) {
            throw serviceError(
                "NOT_FOUND",
                404,
                "The requested attachment was not found.",
            );
        }

        return {
            body: response.Body.transformToWebStream(),
            contentType: response.ContentType,
            contentLength: response.ContentLength,
        } satisfies StorageObject;
    },
};
