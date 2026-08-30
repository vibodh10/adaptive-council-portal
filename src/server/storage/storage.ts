import type { ValidatedImageUpload } from "@/server/storage/imageValidation";

export type StoredAttachment = {
    objectKey: string;
    originalFilename: string;
    mimeType: string;
    size: number;
};

export type StorageObject = {
    body: ReadableStream<Uint8Array> | Uint8Array;
    contentType: string;
    contentLength?: number;
};

export interface PrivateAttachmentStorage {
    putRepairImage(input: {
        councilId: string;
        residentId: string;
        caseId: string;
        image: ValidatedImageUpload;
    }): Promise<StoredAttachment>;
    deleteObject(objectKey: string): Promise<void>;
    getObject(objectKey: string): Promise<StorageObject>;
}
