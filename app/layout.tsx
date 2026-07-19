import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { AppToaster } from "@/components/ui/sonner";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Provenn AI | Contract Intelligence",
  description: "Understand every contract. Prove every version on Monad.",
  icons: {
    icon: [{ url: "/provenn-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/provenn-mark.svg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} ${sans.className}`}>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
