import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { LangProvider } from "@/components/LangProvider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ongles Natalia",
  description: "Service de manucure mobile · Premium mobile nail services",
  metadataBase: new URL(
    process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : "http://localhost:3000"
  ),
  manifest: "/manifest.json",
  openGraph: {
    title: "Ongles Natalia",
    description: "Service de manucure mobile · Premium mobile nail services",
    images: [{ url: "/On.png", width: 1200, height: 630, alt: "Ongles Natalia" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ongles Natalia",
    description: "Service de manucure mobile · Premium mobile nail services",
    images: ["/On.png"],
  },
  themeColor: "#a01060",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ongles Natalia",
  },
  icons: {
    icon: [
      { url: "/favicon.ico",          sizes: "any" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192.png",   sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png",   sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
      { url: "/icons/icon-167.png",   sizes: "167x167" },
      { url: "/icons/icon-152.png",   sizes: "152x152" },
      { url: "/icons/icon-120.png",   sizes: "120x120" },
    ],
    shortcut: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full`}>
      <body className={`min-h-full text-sidebar antialiased ${plusJakarta.className}`}>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
