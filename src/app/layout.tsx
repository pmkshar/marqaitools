import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { PwaInstaller } from "@/components/marqai/pwa-installer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marqai — AI Marketing & AI Tool Testing Suite",
  description:
    "Marqai is an all-in-one AI marketing platform with SEO analytics, multi-platform social marketing, content scheduling, AI image and video creation, automated email campaigns, deep website analysis, and a dedicated AI tool testing module.",
  keywords: [
    "Marqai",
    "AI marketing",
    "SEO analytics",
    "social media marketing",
    "content scheduling",
    "AI image generation",
    "marketing video",
    "email automation",
    "website analyzer",
    "AI tool testing",
  ],
  authors: [{ name: "Marqai Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Marqai",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Marqai — AI Marketing & AI Tool Testing Suite",
    description:
      "All-in-one AI marketing platform with SEO, social, scheduling, image/video, email automation, website analysis, and AI tool testing.",
    siteName: "Marqai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marqai — AI Marketing & AI Tool Testing Suite",
    description:
      "All-in-one AI marketing platform with SEO, social, scheduling, image/video, email automation, website analysis, and AI tool testing.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster richColors position="top-right" />
        <PwaInstaller />
      </body>
    </html>
  );
}
