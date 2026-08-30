import { requirePrincipal } from "@/server/auth/session";
import { drizzleRepairRepository } from "@/server/repairs/repository";
import { jsonError } from "@/server/security/http";
import { serviceError } from "@/server/security/serviceError";
import { s3AttachmentStorage } from "@/server/storage/s3Storage";

export async function GET(
    request: Request,
    context: RouteContext<"/api/repairs/[id]/attachments/[attachmentId]">,
) {
    try {
        const principal = await requirePrincipal(
            ["RESIDENT", "STAFF"],
            request.headers,
        );
        const { id, attachmentId } = await context.params;
        const attachment = await drizzleRepairRepository.getAttachment({
            principal,
            caseId: id,
            attachmentId,
        });

        if (!attachment) {
            throw serviceError(
                "NOT_FOUND",
                404,
                "The requested attachment was not found.",
            );
        }

        const object = await s3AttachmentStorage.getObject(attachment.objectKey);

        return new Response(object.body as BodyInit, {
            headers: {
                "Content-Type": object.contentType,
                ...(object.contentLength
                    ? { "Content-Length": String(object.contentLength) }
                    : {}),
                "Content-Disposition": `inline; filename="${attachment.originalFilename.replaceAll('"', "")}"`,
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        return jsonError(error);
    }
}
