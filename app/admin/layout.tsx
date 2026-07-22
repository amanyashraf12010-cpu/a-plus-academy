"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  CreditCard,
  LogOut,
} from "lucide-react";
import { logoutUser } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    if (!confirm("هل أنت متأكد من تسجيل الخروج؟")) return;
    try {
      await logoutUser();
      router.push("/login");
    } catch (error) {
      console.error("فشل تسجيل الخروج:", error);
    }
  }

  const getLinkClass = (path: string) => {
    const baseClass = "flex items-center gap-3 px-4 py-3 rounded-xl transition font-semibold";
    const isActive = pathname === path;
    return isActive
      ? `${baseClass} bg-[#F3F2FF] text-[#7D79F1] shadow-sm`
      : `${baseClass} text-[#2D2B7A] hover:bg-[#F3F2FF]/50 hover:text-[#7D79F1]`;
  };

  return (
    <div className="min-h-screen flex bg-[#F5F7FB]" dir="rtl">

      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-l shadow-sm flex flex-col">

        {/* Logo */}
        <div className="p-8 border-b">
          <h1 className="text-3xl font-extrabold text-[#2D2B7A] text-center">
            A+ Academy
          </h1>
          <p className="text-center text-xs text-gray-400 mt-2 font-bold uppercase tracking-wider">
            لوحة تحكم الإدارة
          </p>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-5 space-y-2">

          <Link href="/admin" className={getLinkClass("/admin")}>
            <LayoutDashboard size={20} />
            الرئيسية
          </Link>

          <Link href="/admin/courses" className={getLinkClass("/admin/courses")}>
            <BookOpen size={20} />
            الكورسات
          </Link>

          <Link href="/admin/teachers" className={getLinkClass("/admin/teachers")}>
            <GraduationCap size={20} />
            المدرسين
          </Link>

          <Link href="/admin/students" className={getLinkClass("/admin/students")}>
            <Users size={20} />
            الطلاب
          </Link>

          <Link href="/admin/payments" className={getLinkClass("/admin/payments")}>
            <CreditCard size={20} />
            تأكيد المدفوعات
          </Link>

        </nav>

        {/* Logout */}
        <div className="p-5 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl hover:bg-red-100 transition font-bold text-sm cursor-pointer"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>

    </div>
  );
}