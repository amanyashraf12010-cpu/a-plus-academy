"use client";

import { useEffect, useState } from "react";
import Button from "@/components/shared/Button";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function HeroContent() {
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
    <div className="flex-1 text-right">
      
      <h1 className="text-4xl md:text-5xl font-bold text-[#02343F] leading-tight">
        ابدأ رحلتك التعليمية مع A Plus Academy
      </h1>

      <p className="mt-5 text-gray-600 text-lg">
        تعلم مع أفضل المدرسين في مكان واحد وابدأ طريق النجاح بخطوات بسيطة.
      </p>

      <div className="mt-8 flex gap-4 justify-end">
        {user ? (
          <Link href="/my-courses">
            <Button 
              size="lg" 
              className="cursor-pointer animate-premium-pulse font-extrabold text-lg px-10 py-5 shadow-lg shadow-[#7D79F1]/30 hover:shadow-2xl transition-all duration-300"
            >
              استكمل التعلم 🚀
            </Button>
          </Link>
        ) : (
          <>
            <Link href="/register">
              <Button className="cursor-pointer">
                ابدأ الآن
              </Button>
            </Link>

            <Link href="/#courses">
              <Button variant="outline" className="cursor-pointer">
                تصفح الكورسات
              </Button>
            </Link>
          </>
        )}
      </div>

    </div>
  );
}