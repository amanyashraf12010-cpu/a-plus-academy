"use client";

import { useEffect, useState } from "react";
import Container from "@/components/shared/Container";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function CTASection() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      setUser(res.data?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <section className="py-24 bg-white">
      <Container>

        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#7D79F1] to-[#655EF0] px-8 py-16 md:px-16 shadow-xl">
          {/* Background subtle glow */}
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#7D79F1]/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-[#7D79F1]/10 blur-3xl" />

          <div className="relative z-10 text-center">

            <span className="inline-block rounded-full bg-white/15 px-4 py-2 text-sm text-white backdrop-blur">
              🚀 ابدأ رحلتك التعليمية اليوم
            </span>

            <h2 className="mt-6 text-4xl font-extrabold text-white md:text-5xl">
              جاهز تحقق حلمك وتجيب <span className="text-yellow-300">A+</span>؟
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/90">
              انضم لآلاف الطلاب اللي اختاروا A Plus Academy، واستفادوا من أفضل
              المدرسين، والكورسات، والامتحانات، والمتابعة المستمرة.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {user ? (
                <Link
                  href="/my-courses"
                  className="rounded-xl bg-white px-12 py-4 font-bold text-[#7D79F1] transition hover:scale-105 hover:shadow-xl cursor-pointer"
                >
                  استكمل التعلم
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="rounded-xl bg-white px-8 py-4 font-bold text-[#7D79F1] transition hover:scale-105 hover:shadow-xl cursor-pointer"
                  >
                    ابدأ الآن
                  </Link>

                  <Link
                    href="/#courses"
                    className="flex items-center gap-2 rounded-xl border border-white/30 px-8 py-4 font-semibold text-white backdrop-blur transition hover:bg-white/10 cursor-pointer"
                  >
                    تصفح الكورسات
                    <ArrowLeft size={18} />
                  </Link>
                </>
              )}
            </div>

          </div>

        </div>

      </Container>
    </section>
  );
}