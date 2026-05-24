import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dash — Polymarket Mirror",
  description: "Real-time prediction-market mirror trading dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
