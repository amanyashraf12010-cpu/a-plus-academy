import type { Metadata } from "next";
import { Lemonada } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar/Navbar";


const lemonada = Lemonada({
  variable: "--font-lemonada",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
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
      className={`${lemonada.variable} h-full antialiased`}
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