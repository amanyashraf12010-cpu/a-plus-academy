"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function MobileMenu({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    if (!confirm("هل أنت متأكد من تسجيل الخروج؟")) return;
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
  }

  return (
    <div className="md:hidden">
      {/* Burger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="text-3xl text-[#2D2B7A] cursor-pointer"
      >
        ☰
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 right-0 h-full w-64 bg-white z-50 shadow-lg
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="p-5 flex flex-col gap-6" dir="rtl">
          
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            className="text-right text-2xl text-[#2D2B7A] cursor-pointer"
          >
            ✕
          </button>

          {/* User Welcome */}
          {user && (
            <div className="border-b pb-4">
              <p className="text-[#2D2B7A] font-bold text-sm">
                أهلاً، {user.user_metadata?.full_name || "الطالب"} 👋
              </p>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-lg font-bold text-[#2D2B7A] hover:text-[#7D79F1]"
            >
              الرئيسية
            </Link>

            <Link
              href="/#courses"
              onClick={() => setOpen(false)}
              className="text-lg font-bold text-[#2D2B7A] hover:text-[#7D79F1]"
            >
              كورستنا
            </Link>

            <Link
              href="/#teachers"
              onClick={() => setOpen(false)}
              className="text-lg font-bold text-[#2D2B7A] hover:text-[#7D79F1]"
            >
              المدرسين
            </Link>

            {user ? (
              <>
                <Link
                  href="/my-courses"
                  onClick={() => setOpen(false)}
                  className="text-lg font-bold text-[#2D2B7A] hover:text-[#7D79F1]"
                >
                  كورساتي
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="text-lg font-bold text-[#2D2B7A] hover:text-[#7D79F1]"
                >
                  حسابي
                </Link>

                <button
                  onClick={handleLogout}
                  className="mt-4 w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition font-bold text-sm cursor-pointer border border-red-200 text-center"
                >
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-lg font-bold text-[#7D79F1] hover:underline"
                >
                  تسجيل الدخول
                </Link>

                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="text-lg font-bold text-[#7D79F1] hover:underline"
                >
                  إنشاء حساب
                </Link>
              </>
            )}
            
            <Link
              href="/#contact"
              onClick={() => setOpen(false)}
              className="text-lg font-bold text-[#2D2B7A] hover:text-[#7D79F1] border-t pt-4"
            >
              اتواصل معانا
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}