"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import { createClient } from "@/utils/supabase/client";

export default function AuthButtons({ user }: { user: any }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    if (!confirm("هل أنت متأكد من تسجيل الخروج؟")) return;
    await supabase.auth.signOut();
    router.push("/");
  }

  if (user) {
    return (
      <div className="flex items-center gap-4 bg-[#F3F2FF]/50 px-4 py-2 rounded-2xl border border-[#7D79F1]/10">
        <span className="text-[#2D2B7A] font-semibold text-sm">
          أهلاً، {user.user_metadata?.full_name || "الطالب"} 👋
        </span>
        <button
          onClick={handleLogout}
          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition font-bold text-xs cursor-pointer border border-red-200"
        >
          تسجيل الخروج
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">

      <div className="transition duration-300 hover:-translate-y-1">
        <Button
          onClick={() => router.push("/login")}
          className="bg-transparent border border-[#7D79F1] !text-[#7D79F1] hover:bg-[#7D79F1] hover:!text-white transition"
        >
          سجل دخولك
        </Button>
      </div>


      <div className="transition duration-300 hover:-translate-y-1">
        <Button
          onClick={() => router.push("/register")}
          className="bg-[#7D79F1] text-white border border-[#7D79F1] hover:opacity-90"
        >
          اعمل حساب
        </Button>
      </div>

    </div>
  );
}