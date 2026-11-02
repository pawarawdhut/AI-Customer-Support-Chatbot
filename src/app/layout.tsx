import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbit Support — thoughtful AI support for your website",
  description:
    "Create a helpful AI support assistant, teach it about your business, and embed it on your website.",
  icons: { icon: "/orbit.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
