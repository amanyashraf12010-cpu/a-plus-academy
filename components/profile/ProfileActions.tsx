"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ProfileActions() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4">

      <button className="w-full bg-[#7D79F1] hover:bg-[#6965E6] text-white py-4 rounded-2xl font-semibold transition">
        تعديل البيانات
      </button>

      <button className="w-full border border-[#7D79F1] text-[#7D79F1] py-4 rounded-2xl font-semibold hover:bg-[#F3F2FF] transition">
        تغيير كلمة المرور
      </button>

      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-semibold transition"
      >
        تسجيل الخروج
      </button>

    </div>
  );
}