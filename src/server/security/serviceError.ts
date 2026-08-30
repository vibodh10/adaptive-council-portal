export type ServiceErrorCode =
    | "AUTH_REQUIRED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "INVALID_INPUT"
    | "RATE_LIMITED"
    | "UPLOAD_INVALID"
    | "STORAGE_UNAVAILABLE"
    | "DATABASE_UNAVAILABLE"
    | "DELIVERY_CONFIGURATION_INVALID"
    | "CONFLICT";

export class ServiceError extends Error {
    readonly code: ServiceErrorCode;
    readonly status: number;
    readonly details?: Record<string, unknown>;

    constructor(
        code: ServiceErrorCode,
        status: number,
        message: string,
        details?: Record<string, unknown>,
    ) {
        super(message);
        this.name = "ServiceError";
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

export function serviceError(
    code: ServiceErrorCode,
    status: number,
    message: string,
    details?: Record<string, unknown>,
): ServiceError {
    return new ServiceError(code, status, message, details);
}
