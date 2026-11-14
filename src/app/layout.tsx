import type { Metadata, Viewport } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const display = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

function getSiteUrl(): URL {
  const value = process.env.NEXT_PUBLIC_SITE_URL;

  if (value) {
    try {
      return new URL(value);
    } catch {
      return new URL("http://localhost:3000");
    }
  }

  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Eden Bites — Good Food. Great Moments. Every Bite.",
    template: "%s | Eden Bites",
  },
  description:
    "Freshly made Ghanaian meals for delivery or pickup. Order online and pay on arrival.",
  applicationName: "Eden Bites",
  keywords: [
    "Eden Bites",
    "Ghanaian food",
    "food delivery",
    "food pickup",
    "banku",
    "tilapia",
    "acheke",
    "Ghana",
  ],
  openGraph: {
    type: "website",
    siteName: "Eden Bites",
    title: "Eden Bites — Good Food. Great Moments. Every Bite.",
    description:
      "Freshly made Ghanaian meals for delivery or pickup. Order online and pay on arrival.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eden Bites — Good Food. Great Moments. Every Bite.",
    description:
      "Freshly made Ghanaian meals for delivery or pickup. Order online and pay on arrival.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#174B20",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
