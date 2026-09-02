"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAssistantCourses, getAssistantProfile } from "@/lib/assistant";
import { 
  BookOpen, 
  Video, 
  FileQuestion, 
  FileText, 
  ArrowRight, 
  Layers, 
  GraduationCap, 
  Loader2,
  CheckCircle2
} from "lucide-react";

export default function AssistantCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [coursesData, profileData] = await Promise.all([
          getAssistantCourses(),
          getAssistantProfile(),
        ]);
        setCourses(coursesData || []);
        setTeacher(profileData.teacher);
      } catch (err: any) {
        console.error("فشل تحميل الكورسات:", err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2D2B7A] flex items-center gap-3">
            <BookOpen className="text-[#7D79F1]" size={32} />
            كورسات الأستاذ {teacher?.name || ""}
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-semibold">
            مشاهدة الكورسات والمحاضرات وإدارة الكويزات والواجبات المرتبطة بها
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border">
          <Loader2 className="animate-spin text-[#7D79F1] mx-auto mb-3" size={36} />
          <p className="text-gray-500 font-bold">جاري تحميل قائمة الكورسات...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-3xl border p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F3F2FF] text-[#7D79F1] flex items-center justify-center mx-auto">
            <BookOpen size={32} />
          </div>
          <h3 className="text-xl font-bold text-[#2D2B7A]">لا توجد كورسات مضافة لهذا المدرس حالياً</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            عندما يقوم المدير بإضافة كورسات للأستاذ {teacher?.name || ""} ستظهر هنا تلقائياً لتتمكني من إدارة واجباتها وكويزاتها.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const lessonsCount = course.lessons?.length || 0;
            const quizzesCount = course.quizzes?.length || 0;

            return (
              <div
                key={course.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:border-[#7D79F1]/40 transition group"
              >
                {/* Course Cover Image */}
                <div className="relative h-44 bg-gray-100 overflow-hidden">
                  <img
                    src={course.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600"}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-[#2D2B7A] shadow-sm">
                    {course.grade || "عام"}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-[#2D2B7A] text-lg leading-tight line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                      {course.description || "لا يوجد وصف مختصر للكورس."}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 pt-2 text-xs font-bold text-gray-600 flex-wrap">
                    <span className="bg-purple-50 text-[#7D79F1] px-2.5 py-1 rounded-xl border border-purple-100 flex items-center gap-1">
                      <Layers size={13} />
                      {lessonsCount} محاضرات
                    </span>
                    <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-xl border border-blue-100 flex items-center gap-1">
                      <FileQuestion size={13} />
                      {quizzesCount} كويزات
                    </span>
                  </div>

                  {/* Actions Grid */}
                  <div className="pt-4 border-t space-y-2">
                    <Link
                      href={`/assistant/lesson?courseId=${course.id}`}
                      className="w-full py-2.5 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Layers size={14} />
                      عرض المحاضرات ومحتواها
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/assistant/courses/exams?courseId=${course.id}`}
                        className="py-2.5 bg-purple-50 hover:bg-purple-100 text-[#7D79F1] rounded-xl font-bold text-xs transition text-center flex items-center justify-center gap-1"
                      >
                        <FileQuestion size={13} />
                        الامتحان الشامل
                      </Link>
                      <Link
                        href={`/assistant/students?courseId=${course.id}`}
                        className="py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-xs transition text-center flex items-center justify-center gap-1"
                      >
                        طلاب الكورس
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
