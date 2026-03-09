import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ISO Pro — Merchant Statement Analysis",
  description:
    "Your credit card processing statement is 30 pages of deliberately confusing garbage. We turn it into the truth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={jetbrainsMono.variable}
        style={{ margin: 0, padding: 0, background: "#0a0a0a" }}
      >
        {children}
      </body>
    </html>
  );
}