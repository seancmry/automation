import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HR AI HITL — Vercel AI SDK + Odoo",
  description:
    "draft HR case notes with the Vercel AI SDK, approve with HITL, write to Odoo or mock storage.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
