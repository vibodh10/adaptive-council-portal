import type {
    CouncilDeliveryAdapter,
    DeliveryOutcome,
} from "@/server/delivery/types";

export const westbridgeSandboxAdapter: CouncilDeliveryAdapter = {
    adapterType: "SANDBOX",
    async deliver(): Promise<DeliveryOutcome> {
        return {
            adapterType: "SANDBOX",
            succeeded: true,
            safeMetadata: {
                destination: "westbridge-demo-staff-inbox",
                externalSystem: false,
            },
        };
    },
};
