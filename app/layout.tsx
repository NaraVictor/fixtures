import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: "Moon Odds – AI football tips & picks",
  description:
    "Winning football tips from smart analysis. Browse fixtures, confidence scores, and match breakdowns.",
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
        <div className="pb-[calc(6.05rem+env(safe-area-inset-bottom,0px))]">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
