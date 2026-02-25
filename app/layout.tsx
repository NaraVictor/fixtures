import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fixtures – AI predictions",
  description: "AI-powered sports predictions and results",
  themeColor: "#0b835c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
