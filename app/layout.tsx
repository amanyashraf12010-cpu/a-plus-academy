import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/navbar/Navbar";


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
    <a
      href="https://wa.me/201014257625"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#1ebd59] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
      aria-label="تواصل معنا عبر واتساب"
    >
      <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-40 animate-ping group-hover:opacity-60 transition-opacity duration-300 -z-10" />
      <svg
        className="w-8 h-8 fill-current"
        viewBox="0 0 448 512"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.7 23.6 9.2 31.7 11.7 13.8 4.4 26.3 3.8 36.3 2.3 11-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
      </svg>
      <span className="absolute left-16 scale-0 transition-all duration-300 group-hover:scale-100 bg-[#2D2B7A] text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap origin-left">
        تواصل معنا عبر واتساب 💬
      </span>
    </a>

  </body>
    </html>
  );
}