import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DeRadar - Decentralized Aircraft Tracking",
  description:
    "Real-time and historical aircraft tracking powered by Ar.io & Arweave",
  keywords: ["aircraft", "tracking", "radar", "aviation", "arweave", "decentralized"],
  authors: [{ name: "Derad Network" }],
  creator: "Derad Network",
  publisher: "Derad Network",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#0f172a",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
