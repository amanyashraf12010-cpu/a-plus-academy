"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  PlayCircle, 
  FileText, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  ShoppingBag,
  Loader2
} from "lucide-react";
import { getCourseSubscriptionStatus } from "@/lib/student";

export default function CourseLessonsList({ 
  course, 
  lessons = [] 
}: { 
  course: any; 
  lessons: any[];
}) {
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<{
    isLoggedIn: boolean;
    isFullApproved: boolean;
    unlockedLessonIds: string[];
    pendingLessonIds: string[];
  }>({
    isLoggedIn: false,
    isFullApproved: false,
    unlockedLessonIds: [],
    pendingLessonIds: [],
  });
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        setLoadingStatus(true);
        const res = await getCourseSubscriptionStatus(course.id);
        setUserStatus({
          isLoggedIn: res.isLoggedIn,
          isFullApproved: res.isFullApproved,
          unlockedLessonIds: res.unlockedLessonIds || [],
          pendingLessonIds: res.pendingLessonIds || [],
        });
      } catch (err) {
        console.error("Failed to load subscription status for lessons:", err);
      } finally {
        setLoadingStatus(false);
      }
    }
    checkStatus();
  }, [course.id]);

  const toggleExpand = (id: string) => {
    setExpandedLessonId(prev => (prev === id ? null : id));
  };

  const allowsLessonPurchase = 
    course.subscription_type === "lessons" || course.subscription_type === "both";

  if (!lessons || lessons.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border p-8 text-center text-gray-400">
        لم يتم إضافة حصص لهذا الكورس بعد.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6 md:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-[#2D2B7A] flex items-center gap-2.5">
            <span>📚</span> محتوى الكورس والحصص
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            {lessons.length} حصة تدريبية ومحاضرة دراسية
          </p>
        </div>

        {allowsLessonPurchase && (
          <span className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-[#7D79F1]/30 text-[#7D79F1] text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 w-fit">
            <Sparkles size={14} className="text-[#7D79F1]" />
            متاح الاشتراك بالحصة المنفصلة
          </span>
        )}
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {lessons.map((lesson, index) => {
          const isExpanded = expandedLessonId === lesson.id;
          const isUnlocked = 
            userStatus.isFullApproved || 
            userStatus.unlockedLessonIds.includes(lesson.id);
          const isPending = userStatus.pendingLessonIds.includes(lesson.id);
          const lessonPrice = Number(lesson.price) || 0;

          return (
            <div 
              key={lesson.id}
              className={`rounded-2xl border transition duration-200 overflow-hidden ${
                isUnlocked 
                  ? "bg-emerald-50/30 border-emerald-200" 
                  : isExpanded 
                    ? "bg-[#FBFBFF] border-[#7D79F1]/40 shadow-sm" 
                    : "bg-white border-gray-200/80 hover:border-gray-300"
              }`}
            >
              {/* Top Row / Card Bar */}
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Right / Info */}
                <div 
                  className="flex items-start sm:items-center gap-3.5 flex-1 cursor-pointer select-none min-w-0"
                  onClick={() => toggleExpand(lesson.id)}
                >
                  {/* Circle number */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                    isUnlocked
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                      : "bg-[#F3F2FF] text-[#7D79F1] border-[#7D79F1]/20"
                  }`}>
                    {isUnlocked ? <CheckCircle2 size={18} /> : (lesson.order || index + 1)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[#2D2B7A] text-base hover:text-[#7D79F1] transition">
                        {lesson.title}
                      </h3>

                      {/* Lesson duration badge */}
                      {lesson.duration && (
                        <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                          <Clock size={10} />
                          {lesson.duration}
                        </span>
                      )}

                      {/* Price Badge */}
                      {allowsLessonPurchase && (
                        <span className="bg-purple-50 text-[#7D79F1] text-[11px] px-2.5 py-0.5 rounded-lg border border-purple-200 font-bold">
                          {lessonPrice > 0 ? `${lessonPrice} جنيه` : "مجانية"}
                        </span>
                      )}
                    </div>

                    {lesson.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {lesson.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Left / Actions & Toggle */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0">
                  
                  {/* Status / Purchase Button */}
                  {loadingStatus ? (
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Loader2 size={13} className="animate-spin" />
                    </div>
                  ) : isUnlocked ? (
                    <Link
                      href={`/learn/${course.id}`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                    >
                      <PlayCircle size={14} />
                      دخول الحصة
                    </Link>
                  ) : isPending ? (
                    <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1">
                      <Clock size={13} className="animate-pulse" />
                      قيد المراجعة ⏳
                    </span>
                  ) : allowsLessonPurchase ? (
                    <Link
                      href={
                        userStatus.isLoggedIn
                          ? `/courses/${course.id}/checkout?lessonId=${lesson.id}`
                          : `/login?redirectTo=/courses/${course.id}/checkout?lessonId=${lesson.id}`
                      }
                      className="px-4 py-2 bg-[#7D79F1] hover:bg-[#655EF0] text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                    >
                      <ShoppingBag size={14} />
                      {lessonPrice > 0 ? `اشتراك بالحصة (${lessonPrice} ج)` : "اشترك بالحصة"}
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                      <Lock size={13} />
                      ضمن الكورس الكامل
                    </span>
                  )}

                  {/* Accordion toggle button */}
                  <button
                    onClick={() => toggleExpand(lesson.id)}
                    className="p-2 text-gray-400 hover:text-[#7D79F1] hover:bg-gray-100 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                    title="استعراض تفاصيل الحصة"
                  >
                    <span className="hidden sm:inline text-[11px]">
                      {isExpanded ? "إخفاء التفاصيل" : "محتوى الحصة"}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

              </div>

              {/* Expandable Preview Section */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 bg-white border-t border-gray-100/80 text-sm space-y-3 animate-in fade-in duration-200">
                  
                  {lesson.description && (
                    <div className="bg-gray-50/70 p-3.5 rounded-xl text-gray-700 text-xs leading-6 border border-gray-100">
                      <p className="font-bold text-[#2D2B7A] mb-1">📖 ماذا سنتعلم في هذه الحصة؟</p>
                      <p>{lesson.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    
                    {/* Video Item */}
                    <div className="p-3 bg-[#F8F9FD] rounded-xl border border-gray-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#7D79F1] flex items-center justify-center shrink-0">
                        <PlayCircle size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2D2B7A]">فيديو الشرح</p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {lesson.duration || "شرح مفصل وعالي الجودة"}
                        </p>
                      </div>
                    </div>

                    {/* PDF Item */}
                    <div className="p-3 bg-[#F8F9FD] rounded-xl border border-gray-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2D2B7A]">مذكرة وملخص الدرس</p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {lesson.pdf_url ? "ملف PDF جاهز للتحميل" : "ملخص وملاحظات مرافقة"}
                        </p>
                      </div>
                    </div>

                    {/* Quiz Item */}
                    <div className="p-3 bg-[#F8F9FD] rounded-xl border border-gray-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <HelpCircle size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2D2B7A]">الواجب والتدريبات</p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {lesson.hasQuiz ? "واجب تفاعلي بعد الحصة" : "تدريبات وتطبيقات عملية"}
                        </p>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
