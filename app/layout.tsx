import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { PushNotificationInit } from "@/components/push-notification-init";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "DeRadar - Decentralized Aircraft Tracking",
  description:
    "Real-time and historical aircraft tracking powered by Ar.io & Arweave",
  keywords: ["aircraft", "tracking", "radar", "aviation", "arweave", "decentralized"],
  authors: [{ name: "Derad Network" }],
  creator: "Derad Network",
  publisher: "Derad Network",
  robots: "index, follow",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon-32.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon-32.png" type="image/png" />
        <link rel="shortcut icon" href="/icon-32.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* DNS Prefetch & Preconnect for external resources */}
        <link rel="dns-prefetch" href="https://derad.network" />
        <link rel="dns-prefetch" href="https://svg-api.deradar.app" />
        <link rel="dns-prefetch" href="https://content.airhex.com" />
        <link rel="dns-prefetch" href="https://antenna-1.derad.org" />
        <link rel="dns-prefetch" href="https://airline-logo-api.derad.org" />
        <link rel="dns-prefetch" href="https://api.planespotters.net" />

        <link rel="preconnect" href="https://derad.network" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://svg-api.deradar.app" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://content.airhex.com" crossOrigin="anonymous" />

        {/* Map tile providers */}
        <link rel="dns-prefetch" href="https://a.basemaps.cartocdn.com" />
        <link rel="dns-prefetch" href="https://b.basemaps.cartocdn.com" />
        <link rel="dns-prefetch" href="https://c.basemaps.cartocdn.com" />

        <script
          defer
          data-domain="deradar.derad.network"
          src="https://data.derad.org/js/script.file-downloads.hash.outbound-links.pageview-props.tagged-events.js"
        ></script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <PushNotificationInit />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
