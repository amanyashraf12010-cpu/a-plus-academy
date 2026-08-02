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
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.528 2.028 14.07 1.001 11.455 1c-5.44 0-9.868 4.375-9.872 9.804-.001 1.65.438 3.268 1.272 4.693l-.989 3.614 3.701-.957zM17.47 15.37c-.3-.15-1.77-.874-2.046-.975-.276-.101-.477-.15-.677.15-.2.3-.77.975-.944 1.174-.173.199-.347.224-.647.075-1.927-.962-3.14-1.96-4.382-4.09-.301-.514.301-.478.86-1.593.09-.18.044-.337-.023-.487-.067-.15-.577-1.39-.79-1.9-.208-.5-.436-.432-.596-.44-.153-.008-.328-.01-.502-.01-.174 0-.457.065-.697.325-.24.26-.917.896-.917 2.185 0 1.29.936 2.533 1.066 2.7.13.167 1.84 2.87 4.45 4.004.62.27 1.1.43 1.478.55.626.2 1.192.17 1.64.1.5-.078 1.77-.723 2.022-1.42.252-.697.252-1.295.176-1.42-.076-.127-.276-.201-.576-.351z" />
      </svg>
      <span className="absolute right-16 scale-0 transition-all duration-300 group-hover:scale-100 bg-[#2D2B7A] text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap origin-right">
        تواصل معنا عبر واتساب 💬
      </span>
    </a>

  </body>
    </html>
  );
}