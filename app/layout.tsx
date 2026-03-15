import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Golden Goal – Smart picks for football lovers",
  description:
    "Data-backed football picks. Filter by league and market, follow your slip, and level up your tipping.",
};

export const viewport: Viewport = {
  themeColor: "#0b835c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=document.documentElement.getAttribute('data-theme');if(!t&&!localStorage.getItem('theme')){document.documentElement.setAttribute('data-theme','dark');}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
