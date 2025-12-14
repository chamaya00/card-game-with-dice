import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Card Game",
  description: "A multiplayer card game - First to 10 points wins!",
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
