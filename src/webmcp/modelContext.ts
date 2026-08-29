export type WebMcpToolInput = Record<string, unknown>;

export type WebMcpToolAnnotations = {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
};

export type WebMcpTool = {
    name: string;
    title?: string;
    description: string;
    inputSchema?: Record<string, unknown>;
    annotations?: WebMcpToolAnnotations;
    execute: (
        input: WebMcpToolInput,
        options: { signal: AbortSignal },
    ) => unknown | Promise<unknown>;
};

export type WebMcpModelContext = {
    registerTool: (
        tool: WebMcpTool,
        options?: { signal?: AbortSignal },
    ) => Promise<void>;
};

export function getDocumentModelContext(
    currentDocument: Document,
): WebMcpModelContext | undefined {
    return (
        currentDocument as Document & {
            modelContext?: WebMcpModelContext;
        }
    ).modelContext;
}
