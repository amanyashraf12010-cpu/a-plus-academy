"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  getAssistantHomeStats, 
  getAssistantProfile 
} from "@/lib/assistant";
import { 
  BookOpen, 
  Users, 
  ArrowRight,
  GraduationCap,
  Sparkles,
  Loader2,
  ShieldCheck
} from "lucide-react";

export default function AssistantDashboardPage() {
  const [stats, setStats] = useState<{ coursesCount: number; studentsCount: number } | null>(null);
  const [assistantInfo, setAssistantInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [statsData, profileData] = await Promise.all([
          getAssistantHomeStats(),
          getAssistantProfile(),
        ]);
        setStats(statsData);
        setAssistantInfo(profileData);
      } catch (err: any) {
        console.error("فشل تحميل بيانات المساعدة:", err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7D79F1]" size={36} />
      </div>
    );
  }

  const teacherName = assistantInfo?.teacher?.name || "المدرس المسؤول";
  const teacherSubject = assistantInfo?.teacher?.subject || "";
  const assistantName = assistantInfo?.profile?.full_name || "المساعدة";

  return (
    <div className="space-y-8 max-w-6xl" dir="rtl">
      
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-[#2D2B7A] via-[#4A45A8] to-[#7D79F1] rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-[#7D79F1]/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            <Sparkles size={14} className="text-yellow-300" />
            <span>لوحة تحكم مساعدة المدرس</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            أهلاً بكِ، {assistantName} 👋
          </h1>
          <p className="text-purple-100 text-sm font-medium flex items-center gap-1.5">
            <GraduationCap size={16} />
            أنتِ مساعدة معتمدة للأستاذ: <span className="font-extrabold text-white underline decoration-yellow-400">{teacherName}</span>
            {teacherSubject && <span className="text-xs text-purple-200">({teacherSubject})</span>}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
          <Link
            href="/assistant/students"
            className="px-5 py-3 bg-white text-[#2D2B7A] rounded-2xl font-bold text-xs hover:bg-gray-50 transition shadow"
          >
            👥 عرض الطلاب
          </Link>
          <Link
            href="/assistant/courses"
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs border border-white/20 transition backdrop-blur-sm"
          >
            📚 استعراض الكورسات
          </Link>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Simple Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* Card 1: Courses Count */}
        <Link
          href="/assistant/courses"
          className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#7D79F1]/40 transition group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs md:text-sm font-bold text-gray-500">
              الكورسات المتاحة للأستاذ {teacherName}
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-[#2D2B7A]">
              {stats?.coursesCount || 0}
            </h3>
            <span className="text-xs text-[#7D79F1] font-bold inline-flex items-center gap-1 mt-1 group-hover:underline">
              استعراض المحاضرات والفيديوهات
              <ArrowRight size={14} />
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#7D79F1] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <BookOpen size={28} />
          </div>
        </Link>

        {/* Card 2: Enrolled Students Count */}
        <Link
          href="/assistant/students"
          className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#7D79F1]/40 transition group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs md:text-sm font-bold text-gray-500">
              الطلاب المشتركون في كورسات المدرس
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-[#2D2B7A]">
              {stats?.studentsCount || 0}
            </h3>
            <span className="text-xs text-[#7D79F1] font-bold inline-flex items-center gap-1 mt-1 group-hover:underline">
              متابعة المشاهدات وحل الواجبات
              <ArrowRight size={14} />
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Users size={28} />
          </div>
        </Link>

      </div>

      {/* Main Direct Navigation Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Navigation Card 1: Students */}
        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#2D2B7A]">قائمة ومتابعة الطلاب</h3>
              <p className="text-gray-400 text-xs mt-0.5">
                أرقام هواتف الطلاب وأولياء الأمور، ومتابعة حل الواجبات ومشاهدة الفيديوهات.
              </p>
            </div>
          </div>
          <Link
            href="/assistant/students"
            className="w-full py-3 bg-[#F3F2FF] hover:bg-[#7D79F1] text-[#7D79F1] hover:text-white rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2"
          >
            الانتقال لصفحة الطلاب
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Navigation Card 2: Courses */}
        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7D79F1] flex items-center justify-center">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#2D2B7A]">استعراض الكورسات والمحاضرات</h3>
              <p className="text-gray-400 text-xs mt-0.5">
                معاينة فيديوهات المحاضرات والتأكد من تشغيلها وصحتها بدون صلاحيات تعديل.
              </p>
            </div>
          </div>
          <Link
            href="/assistant/courses"
            className="w-full py-3 bg-[#F3F2FF] hover:bg-[#7D79F1] text-[#7D79F1] hover:text-white rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2"
          >
            الانتقال لصفحة الكورسات
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>

    </div>
  );
}
