import type { Metadata } from "next";
import "./globals.css";
import {ExperienceProvider} from "@/features/experience/ExperienceProvider";

export const metadata: Metadata = {
  title: "Adaptive Council Portal",
  description: "Adaptive Council Portal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <ExperienceProvider>
            {children}
        </ExperienceProvider>
      </body>
    </html>
  );
}
