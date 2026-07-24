import type { Metadata } from "next";
import { Lateef } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar/Navbar";


const lateef = Lateef({
  variable: "--font-lateef",
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

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
      className={`${lateef.variable} h-full antialiased`}
    >
     <body className="bg-white text-[#02343F]">

  

    <Navbar />

    <main className="flex-1">
      {children}
    </main>

  

</body>
    </html>
  );
}