import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://crm.lifescientific.com"),
  title: {
    default: "LS Nexus — Life Scientific CRM",
    template: "%s | LS Nexus",
  },
  description: "Sales force management platform for Life Scientific.",
  applicationName: "LS Nexus",
  openGraph: {
    type: "website",
    siteName: "LS Nexus",
    title: "LS Nexus — Life Scientific CRM",
    description: "Sales force management platform for Life Scientific.",
    url: "https://crm.lifescientific.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "LS Nexus",
    description: "Life Scientific CRM",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://crm.lifescientific.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
