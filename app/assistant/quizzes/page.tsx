"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAssistantCourses, getAssistantProfile } from "@/lib/assistant";
import { createClient } from "@/utils/supabase/client";
import { 
  FileQuestion, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  Layers, 
  Loader2,
  BookOpen
} from "lucide-react";

export default function AssistantQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  async function loadData() {
    try {
      setLoading(true);
      const coursesData = await getAssistantCourses();
      setCourses(coursesData || []);

      const courseIds = (coursesData || []).map((c: any) => c.id);
      if (courseIds.length === 0) {
        setQuizzes([]);
        return;
      }

      let query = supabase
        .from("quizzes")
        .select(`
          *,
          courses:course_id (id, title),
          lessons:lesson_id (id, title),
          questions (id)
        `)
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });

      if (selectedCourseId !== "all") {
        query = query.eq("course_id", selectedCourseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setQuizzes(data || []);
    } catch (err: any) {
      console.error("فشل تحميل الكويزات:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedCourseId]);

  async function togglePublish(quizId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("quizzes")
        .update({ is_active: !currentStatus })
        .eq("id", quizId);

      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert("فشل تغيير حالة النشر: " + err.message);
    }
  }

  async function handleDeleteQuiz(quizId: string, title: string) {
    if (!confirm(`هل أنتِ متأكدة من حذف تقييم (${title}) بجميع أسئلته نهائياً؟`)) return;
    try {
      const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
      if (error) throw error;
      alert("تم حذف الكويز بنجاح.");
      loadData();
    } catch (err: any) {
      alert("فشل الحذف: " + err.message);
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2D2B7A] flex items-center gap-3">
            <FileQuestion className="text-[#7D79F1]" size={32} />
            الكويزات والامتحانات
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-semibold">
            إنشاء وتعديل وإدارة كويزات المحاضرات والامتحانات الشاملة وتحديد الإجابات الصحيحة ودرجات النجاح
          </p>
        </div>

        {courses.length > 0 && (
          <Link
            href={`/assistant/courses/exams?courseId=${courses[0]?.id}`}
            className="bg-[#7D79F1] hover:bg-[#655EF0] text-white px-5 py-3 rounded-2xl transition font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#7D79F1]/20"
          >
            <Plus size={18} />
            إضافة كويز جديد
          </Link>
        )}
      </div>

      {/* Filter by Course */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <span className="text-xs font-bold text-gray-500 shrink-0">تصفية حسب الكورس:</span>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-bold text-xs bg-white cursor-pointer focus:border-[#7D79F1]"
        >
          <option value="all">جميع الكورسات ({courses.length})</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Quizzes List */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border">
          <Loader2 className="animate-spin text-[#7D79F1] mx-auto mb-3" size={36} />
          <p className="text-gray-500 font-bold">جاري تحميل قائمة الكويزات والامتحانات...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white rounded-3xl border p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-50 text-[#7D79F1] flex items-center justify-center mx-auto">
            <FileQuestion size={32} />
          </div>
          <h3 className="text-xl font-bold text-[#2D2B7A]">لا توجد كويزات أو امتحانات مضافة بعد</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            اضغطي على كورس معين لإضافة كويز إلكتروني للمحاضرات أو امتحان شامل وتحديد درجات النجاح.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => {
            const isFinal = quiz.type === "final";
            const questionsCount = quiz.questions?.length || 0;
            const courseTitle = quiz.courses?.title || "-";
            const lessonTitle = quiz.lessons?.title || null;

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 hover:border-[#7D79F1]/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${
                      isFinal 
                        ? "bg-amber-50 text-amber-700 border-amber-200" 
                        : "bg-purple-50 text-[#7D79F1] border-purple-200"
                    }`}>
                      {isFinal ? "🏆 امتحان شامل نهائي" : "📚 كويز محاضرة"}
                    </span>

                    <button
                      onClick={() => togglePublish(quiz.id, quiz.is_active)}
                      className={`text-[11px] font-bold px-3 py-1 rounded-full border transition cursor-pointer flex items-center gap-1 ${
                        quiz.is_active
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                      }`}
                      title={quiz.is_active ? "اضغطي لإلغاء النشر" : "اضغطي لنشر الكويز"}
                    >
                      {quiz.is_active ? (
                        <>
                          <CheckCircle2 size={12} />
                          منشور ومتاح للطلاب
                        </>
                      ) : (
                        <>
                          <XCircle size={12} />
                          غير منشور (مسودة)
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-[#2D2B7A] text-lg">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                      <BookOpen size={13} className="text-[#7D79F1]" />
                      الكورس: {courseTitle}
                      {lessonTitle && ` | الدرس: ${lessonTitle}`}
                    </p>
                  </div>

                  {/* Metadata Info */}
                  <div className="flex items-center gap-3 pt-2 text-xs font-bold text-gray-600 flex-wrap">
                    <span className="bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200">
                      {questionsCount} أسئلة مضافة
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                      <Award size={13} />
                      درجة النجاح: {quiz.passing_score}%
                    </span>
                    {quiz.duration && (
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-xl border border-blue-200 flex items-center gap-1">
                        <Clock size={13} />
                        المؤقت: {quiz.duration} دقيقة
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t flex items-center gap-2">
                  <Link
                    href={`/assistant/courses/exams?courseId=${quiz.course_id}${quiz.lesson_id ? `&lessonId=${quiz.lesson_id}` : ""}`}
                    className="flex-1 py-2.5 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Edit2 size={14} />
                    إدارة الأسئلة والإعدادات
                  </Link>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition cursor-pointer"
                    title="حذف الكويز"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
