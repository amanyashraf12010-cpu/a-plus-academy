"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface ProfileActionsProps {
  onEdit: () => void;
}

export default function ProfileActions({ onEdit }: ProfileActionsProps) {
  const router = useRouter();

  async function handleLogout() {
    if (!confirm("هل أنت متأكد من تسجيل الخروج؟")) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4" dir="rtl">

      <button
        onClick={onEdit}
        className="w-full bg-[#7D79F1] hover:bg-[#6965E6] text-white py-4 rounded-2xl font-semibold transition cursor-pointer"
      >
        تعديل البيانات
      </button>

      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-semibold transition cursor-pointer"
      >
        تسجيل الخروج
      </button>

    </div>
  );
}