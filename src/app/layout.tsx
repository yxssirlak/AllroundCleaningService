import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Allround | Bedrijfsportaal",
  description: "Het interne bedrijfsportaal van Allround Cleaning Service.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
