import { headers } from "next/headers";

import {
    ServiceError,
    serviceError,
} from "@/server/security/serviceError";
import { auth, isAuthConfigured } from "@/server/auth/auth";

export type UserRole = "RESIDENT" | "STAFF";

export type AuthenticatedPrincipal = {
    userId: string;
    councilId: string;
    role: UserRole;
    email: string;
    displayName: string;
};

export async function getAuthenticatedPrincipal(
    requestHeaders?: Headers,
): Promise<AuthenticatedPrincipal | null> {
    if (!isAuthConfigured()) {
        return null;
    }

    const session = await auth.api.getSession({
        headers: requestHeaders ?? (await headers()),
    });

    if (!session?.user || session.user.active !== true) {
        return null;
    }

    const role = session.user.role;

    if (role !== "RESIDENT" && role !== "STAFF") {
        return null;
    }

    return {
        userId: session.user.id,
        councilId: session.user.councilId,
        role,
        email: session.user.email,
        displayName: session.user.name,
    };
}

export async function requirePrincipal(
    allowedRoles: readonly UserRole[],
    requestHeaders?: Headers,
): Promise<AuthenticatedPrincipal> {
    const principal = await getAuthenticatedPrincipal(requestHeaders);

    if (!principal) {
        throw serviceError(
            "AUTH_REQUIRED",
            401,
            "Sign in to continue.",
        );
    }

    if (!allowedRoles.includes(principal.role)) {
        throw serviceError(
            "FORBIDDEN",
            403,
            "You do not have permission to perform this action.",
        );
    }

    return principal;
}

export function isServiceError(error: unknown): error is ServiceError {
    return error instanceof ServiceError;
}
