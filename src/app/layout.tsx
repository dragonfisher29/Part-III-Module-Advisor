import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Part III Module Advisor",
  description: "Choose 5 optional modules with a guided 3-in-Semester-1 and 2-in-Semester-2 planner.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
