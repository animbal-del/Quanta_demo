import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quanta Scout OS",
  description: "AI-native venture scout management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
