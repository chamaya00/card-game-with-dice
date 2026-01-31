import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Craps-RPG",
  description: "A turn-based card and dice game combining craps mechanics with RPG-style monster-slaying",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
