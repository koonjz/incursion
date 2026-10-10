import type { Metadata, Viewport } from "next";
import { Geist, Newsreader } from "next/font/google";
import "./globals.css";
import { Backdrop } from "@/components/shared/Backdrop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ACM Resolve | Campus events, without the clashes",
  description:
    "One shared calendar for campus events. Submit your event, check for scheduling conflicts instantly, and get it reviewed by ACM Core.",
};

export const viewport: Viewport = {
  themeColor: "#04070f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-body">
        <Backdrop />
        {children}
      </body>
    </html>
  );
}
