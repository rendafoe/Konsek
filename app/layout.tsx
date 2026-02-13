import type { Metadata, Viewport } from "next";
import { DM_Sans, Press_Start_2P, Instrument_Serif } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://konsek.vercel.app"),
  title: "Konsek",
  description: "Your running companion for consistency. Raise a digital companion powered by your real-world runs via Strava.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Konsek",
    description: "Your running companion for consistency. Raise a digital companion powered by your real-world runs via Strava.",
    siteName: "Konsek",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Konsek",
    description: "Your running companion for consistency. Raise a digital companion powered by your real-world runs via Strava.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${pressStart2P.variable} ${instrumentSerif.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
