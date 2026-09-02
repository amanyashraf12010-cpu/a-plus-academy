"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileQuestion,
  FileText,
  CheckSquare,
  LogOut,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { logoutUser } from "@/lib/auth";
import { getAssistantProfile } from "@/lib/assistant";

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [assistantData, setAssistantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const data = await getAssistantProfile();
        setAssistantData(data);
      } catch (err: any) {
        console.error("فشل التحقق من صلاحيات المساعدة:", err.message);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleLogout() {
    if (!confirm("هل أنتِ متأكدة من تسجيل الخروج؟")) return;
    try {
      await logoutUser();
      router.push("/login");
    } catch (error) {
      console.error("فشل تسجيل الخروج:", error);
    }
  }

  const getLinkClass = (path: string) => {
    const baseClass = "flex items-center gap-3 px-4 py-3 rounded-2xl transition font-bold text-sm";
    const isActive = pathname === path || (path !== "/assistant" && pathname.startsWith(path));
    return isActive
      ? `${baseClass} bg-[#7D79F1] text-white shadow-md shadow-[#7D79F1]/20`
      : `${baseClass} text-[#2D2B7A] hover:bg-[#F3F2FF] hover:text-[#7D79F1]`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]" dir="rtl">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-[#7D79F1] mx-auto" size={40} />
          <p className="text-[#2D2B7A] font-bold text-base">جاري تحميل لوحة تحكم المساعدة...</p>
        </div>
      </div>
    );
  }

  const teacherName = assistantData?.teacher?.name || "المدرس المسؤول";
  const teacherSubject = assistantData?.teacher?.subject || "";
  const assistantName = assistantData?.profile?.full_name || "مساعدة المدرس";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F9FD]" dir="rtl">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div>
          <h1 className="text-xl font-black text-[#2D2B7A]">A+ Academy</h1>
          <p className="text-[11px] text-[#7D79F1] font-bold">لوحة تحكم المساعدة</p>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 rounded-xl hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 right-0 z-50 h-screen w-[270px] bg-white border-l shadow-sm flex flex-col transition-transform duration-300
        ${mobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
      `}>
        
        {/* Logo & Teacher Info */}
        <div className="p-6 border-b space-y-3">
          <div className="text-center">
            <h1 className="text-2xl font-black text-[#2D2B7A]">
              A+ Academy
            </h1>
            <span className="inline-flex items-center gap-1 bg-purple-50 text-[#7D79F1] text-[11px] px-2.5 py-0.5 rounded-full font-extrabold mt-1 border border-purple-100">
              <ShieldCheck size={12} />
              لوحة تحكم المساعدة
            </span>
          </div>

          {/* Assigned Teacher Card */}
          <div className="bg-[#F8F9FD] p-3 rounded-2xl border border-gray-100 text-center">
            <p className="text-[11px] text-gray-400 font-bold mb-0.5">المدرس المسؤول:</p>
            <h3 className="font-extrabold text-[#2D2B7A] text-sm flex items-center justify-center gap-1.5">
              <GraduationCap size={16} className="text-[#7D79F1]" />
              {teacherName}
            </h3>
            {teacherSubject && (
              <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
                مادة {teacherSubject}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          
          <Link 
            href="/assistant" 
            onClick={() => setMobileMenuOpen(false)}
            className={getLinkClass("/assistant")}
          >
            <LayoutDashboard size={18} />
            الرئيسية
          </Link>

          <Link 
            href="/assistant/courses" 
            onClick={() => setMobileMenuOpen(false)}
            className={getLinkClass("/assistant/courses")}
          >
            <BookOpen size={18} />
            الكورسات
          </Link>

          <Link 
            href="/assistant/students" 
            onClick={() => setMobileMenuOpen(false)}
            className={getLinkClass("/assistant/students")}
          >
            <Users size={18} />
            متابعة الطلاب
          </Link>

          <Link 
            href="/assistant/homeworks" 
            onClick={() => setMobileMenuOpen(false)}
            className={getLinkClass("/assistant/homeworks")}
          >
            <FileText size={18} />
            الواجبات والامتحانات
          </Link>

          <Link 
            href="/assistant/content-review" 
            onClick={() => setMobileMenuOpen(false)}
            className={getLinkClass("/assistant/content-review")}
          >
            <CheckSquare size={18} />
            مراجعة المحتوى
          </Link>

        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-[#F3F2FF] text-[#7D79F1] font-black text-xs flex items-center justify-center">
              {assistantName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#2D2B7A] truncate">{assistantName}</p>
              <p className="text-[10px] text-gray-400 truncate">مساعدة معتمدة</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 rounded-xl hover:bg-red-100 transition font-bold text-xs cursor-pointer"
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-5 md:p-8 overflow-auto min-w-0">
        {children}
      </main>

    </div>
  );
}
