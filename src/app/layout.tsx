import type { Metadata } from "next";

import { ExperienceProvider } from "@/features/experience/ExperienceProvider";
import { HousingRepairProvider } from "@/features/housing-repair/HousingRepairProvider";
import WebMcpRegistration from "@/webmcp/WebMcpRegistration";

import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "Westbridge Council housing repairs | Necivia",
        template: "%s | Necivia",
    },
    description:
        "Secure housing repair services for the fictional Westbridge Council demonstration tenant, powered by Necivia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en">
            <body>
                <ExperienceProvider>
                    <HousingRepairProvider>
                        <WebMcpRegistration />
                        {children}
                    </HousingRepairProvider>
                </ExperienceProvider>
            </body>
        </html>
    );
}
