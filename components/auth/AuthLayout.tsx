import { ReactNode } from "react";
import Image from "next/image";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8F7FF]">

      {/* Background Blur */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#7D79F1]/20 blur-3xl" />
      <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-[#7D79F1]/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#F18A2E]/10 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">

        <div className="grid w-full max-w-7xl overflow-hidden rounded-[36px] bg-white shadow-[0_25px_80px_rgba(0,0,0,.08)] lg:grid-cols-2">

          {/* Illustration */}
          <div className="relative hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-[#7D79F1] via-[#6C63FF] to-[#5A54E8] p-16">

            <div className="absolute top-10 left-10 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute bottom-20 right-16 h-36 w-36 rounded-full bg-white/10" />
            <div className="absolute top-1/2 left-20 h-8 w-8 rounded-full bg-white/30" />

            <img
              src="/auth-illustration.png"
              alt="Education"
              className="w-[430px] h-[430px] drop-shadow-2xl object-contain"
            />

            <h2 className="mt-10 text-4xl font-extrabold text-white">
              A Plus Academy
            </h2>

            <p className="mt-5 max-w-md text-center text-lg leading-8 text-white/90">
              تعلم مع أفضل المدرسين، واشترك في أقوى الكورسات،
              وحقق أعلى الدرجات بسهولة.
            </p>

          </div>

          {/* Form */}
          <div className="flex items-center justify-center p-8 md:p-16">

            <div className="w-full max-w-md">

              {/* Mobile Illustration (visible on mobile/tablet) */}
              <div className="lg:hidden flex justify-center mb-6">
                <img
                  src="/auth-illustration.png"
                  alt="Education"
                  className="w-[160px] h-[160px] object-contain drop-shadow-md"
                />
              </div>

              <span className="mb-3 inline-block rounded-full bg-[#7D79F1]/10 px-4 py-2 text-sm font-semibold text-[#7D79F1]">
                👋 مرحبًا بك
              </span>

              <h1 className="text-4xl font-extrabold text-[#02343F]">
                {title}
              </h1>

             

              {children}

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}