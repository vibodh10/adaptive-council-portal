import type {
    WebMcpModelContext,
    WebMcpTool,
} from "@/webmcp/modelContext";

export async function registerWebMcpTools(
    modelContext: WebMcpModelContext,
    tools: WebMcpTool[],
    signal: AbortSignal,
): Promise<void> {
    for (const tool of tools) {
        if (signal.aborted) {
            return;
        }

        await modelContext.registerTool(tool, { signal });
    }
}
