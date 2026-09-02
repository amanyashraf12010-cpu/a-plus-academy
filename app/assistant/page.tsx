"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  getAssistantDashboardStats, 
  getAssistantProfile 
} from "@/lib/assistant";
import { 
  BookOpen, 
  Users, 
  Video, 
  AlertCircle, 
  FileQuestion, 
  FileText, 
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Loader2
} from "lucide-react";

export default function AssistantDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [assistantInfo, setAssistantInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [statsData, profileData] = await Promise.all([
          getAssistantDashboardStats(),
          getAssistantProfile(),
        ]);
        setStats(statsData);
        setAssistantInfo(profileData);
      } catch (err: any) {
        console.error("فشل تحميل إحصائيات المساعدة:", err.message);
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
  const assistantName = assistantInfo?.profile?.full_name || "المساعدة";

  const statCards = [
    {
      title: "كورساتي",
      count: stats?.coursesCount || 0,
      icon: BookOpen,
      color: "from-purple-500 to-indigo-600",
      bgColor: "bg-purple-50",
      textColor: "text-[#7D79F1]",
      link: "/assistant/courses",
    },
    {
      title: "عدد الطلاب",
      count: stats?.studentsCount || 0,
      icon: Users,
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      link: "/assistant/students",
    },
    {
      title: "الفيديوهات المرفوعة",
      count: stats?.uploadedVideos || 0,
      icon: Video,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      link: "/assistant/content-review",
    },
    {
      title: "الفيديوهات الناقصة",
      count: stats?.missingVideos || 0,
      icon: AlertCircle,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      link: "/assistant/content-review",
    },
    {
      title: "الكويزات المضافة",
      count: stats?.addedQuizzes || 0,
      icon: FileQuestion,
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-50",
      textColor: "text-violet-600",
      link: "/assistant/quizzes",
    },
    {
      title: "الكويزات الناقصة",
      count: stats?.missingQuizzes || 0,
      icon: AlertCircle,
      color: "from-rose-500 to-red-600",
      bgColor: "bg-rose-50",
      textColor: "text-rose-600",
      link: "/assistant/content-review",
    },
    {
      title: "الواجبات المضافة",
      count: stats?.addedHomeworks || 0,
      icon: FileText,
      color: "from-sky-500 to-blue-600",
      bgColor: "bg-sky-50",
      textColor: "text-sky-600",
      link: "/assistant/homeworks",
    },
    {
      title: "الواجبات الناقصة",
      count: stats?.missingHomeworks || 0,
      icon: AlertCircle,
      color: "from-amber-500 to-yellow-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      link: "/assistant/content-review",
    },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-[#2D2B7A] via-[#4A45A8] to-[#7D79F1] rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-[#7D79F1]/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            <Sparkles size={14} className="text-yellow-300" />
            <span>مرحباً بكِ في لوحة التحكم</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            أهلاً بكِ، {assistantName} 👋
          </h1>
          <p className="text-purple-100 text-sm font-medium flex items-center gap-1.5">
            <GraduationCap size={16} />
            أنتِ مساعدة معتمدة للأستاذ: <span className="font-extrabold text-white underline decoration-yellow-400">{teacherName}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
          <Link
            href="/assistant/content-review"
            className="px-5 py-3 bg-white text-[#2D2B7A] rounded-2xl font-bold text-xs hover:bg-gray-50 transition shadow"
          >
            📋 مراجعة المحتوى الناقص
          </Link>
          <Link
            href="/assistant/students"
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs border border-white/20 transition backdrop-blur-sm"
          >
            👥 متابعة الطلاب
          </Link>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 8 Metric KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-[#2D2B7A]">
            📊 ملخص وإحصائيات العمل
          </h2>
          <span className="text-xs text-gray-400 font-bold">محدث لحظياً</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                href={card.link}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#7D79F1]/40 transition group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs md:text-sm font-bold text-gray-600">
                    {card.title}
                  </span>
                  <div className={`w-10 h-10 rounded-2xl ${card.bgColor} ${card.textColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-[#2D2B7A]">
                    {card.count}
                  </h3>
                  <span className="text-[11px] text-[#7D79F1] font-bold inline-flex items-center gap-1 mt-1 group-hover:underline">
                    عرض التفاصيل
                    <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Shortcuts Section */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Card 1: Courses */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7D79F1] flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#2D2B7A]">إدارة الكورسات والدروس</h3>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              مشاهدة كورسات الأستاذ {teacherName} وإضافة وتعديل الواجبات والامتحانات لكل درس.
            </p>
          </div>
          <Link
            href="/assistant/courses"
            className="w-full py-3 bg-[#F3F2FF] hover:bg-[#7D79F1] text-[#7D79F1] hover:text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            الانتقال للكورسات
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Card 2: Students Monitoring */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#2D2B7A]">متابعة أداء الطلاب</h3>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              فلاتر كاملة لمعرفة من شاهد الفيديو، من حل الكويز ودرجته، ومن سلّم الواجب.
            </p>
          </div>
          <Link
            href="/assistant/students"
            className="w-full py-3 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            متابعة الطلاب والفلاتر
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Card 3: Content Review Checklist */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#2D2B7A]">مراجعة وتدقيق المحتوى</h3>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              قائمة تفصيلية بكل محاضرة توضح وجود الفيديو، الكويز، والواجب المرفق بنظرة واحدة.
            </p>
          </div>
          <Link
            href="/assistant/content-review"
            className="w-full py-3 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            فحص المحاضرات
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>

    </div>
  );
}
