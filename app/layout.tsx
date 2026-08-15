import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/navbar/Navbar";
import WhatsAppFloat from "@/components/shared/WhatsAppFloat";
import ProtectionWrapper from "@/components/shared/ProtectionWrapper";
import AuthRedirectGuard from "@/components/shared/AuthRedirectGuard";

export const metadata: Metadata = {
  title: "A Plus Academy",
  description: "Educational Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Zain:wght@200;300;400;700;800;900&display=swap" rel="stylesheet" />
      </head>
     <body className="bg-white text-[#02343F]">

    <Navbar />

    <main className="flex-1">
      {children}
    </main>

    {/* Floating WhatsApp Button */}
    <WhatsAppFloat />

    {/* Global copy/selection/shortcut protection */}
    <ProtectionWrapper />

    {/* Auth redirection parser for expired OTP links */}
    <AuthRedirectGuard />

  </body>
    </html>
  );
}