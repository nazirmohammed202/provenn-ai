import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Provenn AI | Contract Intelligence",
  description: "Understand every contract. Prove every version.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"><body>{children}</body>
    </html>
  );
}
