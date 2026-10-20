import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import AppNav from "@/components/AppNav";
import { AuthProvider } from "@/components/AuthProvider";
import AuthReturn from "@/components/AuthReturn";
import ClientErrorReporter from "@/components/ClientErrorReporter";
import { brand, configuredSiteUrl } from "@/lib/brand.mjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#c4522a",
  width: "device-width",
  initialScale: 1,
};

const siteUrl = configuredSiteUrl() || "https://www.tradematequotes.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  openGraph: {
    type: "website",
    siteName: brand.name,
    locale: "en_GB",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${brand.name} — ${brand.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: brand.shortName,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-GB"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink pb-24 lg:pb-0">
        <AuthProvider>
          <Suspense fallback={null}>
            <AuthReturn />
          </Suspense>
          <ClientErrorReporter />
          <Suspense fallback={<div className="h-16 border-b border-stone-200 bg-white" />}>
            <AppNav />
          </Suspense>
          <div className="flex-1 flex flex-col min-w-0 w-full">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
