import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "TPC Sales Pipeline Dashboard",
  description: "Track sales opportunities, pipeline movement and money in the bank.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
