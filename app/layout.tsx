import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { LangProvider } from "@/components/LangProvider";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Nails on Wheels",
  description: "Service de manucure mobile · Premium mobile nail services",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-cream text-sidebar antialiased">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
