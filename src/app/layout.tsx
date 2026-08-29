import type { Metadata } from "next";

import { ExperienceProvider } from "@/features/experience/ExperienceProvider";
import { HousingRepairProvider } from "@/features/housing-repair/HousingRepairProvider";
import WebMcpRegistration from "@/webmcp/WebMcpRegistration";

import "./globals.css";

export const metadata: Metadata = {
    title: "Report a housing repair | Westbridge Council",
    description:
        "Report a repair needed at a fictional Westbridge Council property.",
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
