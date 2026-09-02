"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { getAssistantCourses, getAssistantContentReview } from "@/lib/assistant";
import { 
  CheckSquare, 
  Video, 
  FileQuestion, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Filter, 
  ArrowRight, 
  Loader2,
  ExternalLink,
  Plus
} from "lucide-react";

function AssistantContentReviewContent() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [onlyIncomplete, setOnlyIncomplete] = useState<boolean>(false);
  const [reviewList, setReviewList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const [coursesData, reviewData] = await Promise.all([
        getAssistantCourses(),
        getAssistantContentReview(selectedCourseId),
      ]);
      setCourses(coursesData || []);
      setReviewList(reviewData || []);
    } catch (err: any) {
      console.error("فشل مراجعة المحتوى:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedCourseId]);

  const filteredList = reviewList.filter((item) => {
    if (onlyIncomplete) return !item.isComplete;
    return true;
  });

  const totalLectures = reviewList.length;
  const completeLectures = reviewList.filter((r) => r.isComplete).length;
  const incompleteLectures = totalLectures - completeLectures;

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2D2B7A] flex items-center gap-3">
            <CheckSquare className="text-[#7D79F1]" size={32} />
            مراجعة وتدقيق المحتوى
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-semibold">
            التأكد من اكتمال عناصر كل محاضرة (الفيديو، الكويز، والواجب) واكتشاف النواقص بسهولة
          </p>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500">إجمالي المحاضرات</span>
            <h3 className="text-2xl font-black text-[#2D2B7A] mt-1">{totalLectures}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7D79F1] flex items-center justify-center font-bold">
            📋
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700">محاضرات مكتملة المحتوى</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{completeLectures}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700">محاضرات ينقصها عناصر</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{incompleteLectures}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-500 shrink-0">تصفية حسب الكورس:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full sm:w-72 px-4 py-2 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-bold text-xs bg-white cursor-pointer focus:border-[#7D79F1]"
          >
            <option value="all">جميع الكورسات ({courses.length})</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label className="flex items-center gap-2 cursor-pointer select-none bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition">
            <input
              type="checkbox"
              checked={onlyIncomplete}
              onChange={(e) => setOnlyIncomplete(e.target.checked)}
              className="w-4 h-4 text-[#7D79F1] rounded cursor-pointer accent-[#7D79F1]"
            />
            <span className="text-xs font-bold text-[#2D2B7A]">
              عرض المحاضرات التي ينقصها محتوى فقط ⚠️
            </span>
          </label>
        </div>

      </div>

      {/* Content Checklist Table */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border">
          <Loader2 className="animate-spin text-[#7D79F1] mx-auto mb-3" size={36} />
          <p className="text-gray-500 font-bold">جاري تدقيق عناصر المحتوى...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl border p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-[#2D2B7A]">
            {onlyIncomplete ? "رائع! جميع المحاضرات مكتملة المحتوى بالكامل 🎉" : "لا توجد محاضرات متاحة"}
          </h3>
          <p className="text-gray-400 text-sm">
            {onlyIncomplete ? "لا توجد أي نواقص في الفيديوهات أو الكويزات أو الواجبات." : "لم يتم العثور على محاضرات في هذا الكورس."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-[#F5F7FB] border-b text-[#2D2B7A] font-bold">
                <tr>
                  <th className="p-4">المحاضرة والكورس</th>
                  <th className="p-4 text-center">الفيديو</th>
                  <th className="p-4 text-center">الكويز</th>
                  <th className="p-4 text-center">الواجب</th>
                  <th className="p-4 text-center">حالة الاكتمال</th>
                  <th className="p-4 text-center">إجراء سريع</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {filteredList.map((item) => (
                  <tr key={item.lessonId} className="hover:bg-[#F3F2FF]/20 transition">
                    
                    {/* Lecture & Course */}
                    <td className="p-4">
                      <div>
                        <span className="font-extrabold text-[#2D2B7A] block text-sm">
                          {item.lessonTitle}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold block mt-0.5">
                          الكورس: {item.courseTitle}
                        </span>
                      </div>
                    </td>

                    {/* Video Status */}
                    <td className="p-4 text-center">
                      {item.hasVideo ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                          <CheckCircle2 size={13} />
                          تم رفعه ✅
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-200">
                          <XCircle size={13} />
                          غير موجود ❌
                        </span>
                      )}
                    </td>

                    {/* Quiz Status */}
                    <td className="p-4 text-center">
                      {item.hasQuiz ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                          <CheckCircle2 size={13} />
                          تمت إضافته ✅
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-200">
                          <XCircle size={13} />
                          غير موجود ❌
                        </span>
                      )}
                    </td>

                    {/* Homework Status */}
                    <td className="p-4 text-center">
                      {item.hasHomework ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                          <CheckCircle2 size={13} />
                          تمت إضافته ✅
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-200">
                          <XCircle size={13} />
                          غير موجود ❌
                        </span>
                      )}
                    </td>

                    {/* Overall Status */}
                    <td className="p-4 text-center">
                      {item.isComplete ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-black">
                          مكتمل بالكامل 🌟
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-black">
                          ينقصه محتوى ⚠️
                        </span>
                      )}
                    </td>

                    {/* Action Shortcut */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!item.hasQuiz && (
                          <Link
                            href={`/assistant/courses/exams?courseId=${item.courseId}&lessonId=${item.lessonId}`}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#7D79F1] rounded-xl text-xs font-bold transition flex items-center gap-1 border border-purple-100"
                            title="إضافة كويز لهذه المحاضرة"
                          >
                            <Plus size={12} />
                            كويز
                          </Link>
                        )}
                        {!item.hasHomework && (
                          <Link
                            href={`/assistant/lesson?courseId=${item.courseId}`}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-blue-100"
                            title="إرفاق واجب لهذه المحاضرة"
                          >
                            <Plus size={12} />
                            واجب
                          </Link>
                        )}
                        {item.isComplete && (
                          <Link
                            href={`/assistant/lesson?courseId=${item.courseId}`}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition border"
                          >
                            معاينة
                          </Link>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AssistantContentReviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500 font-bold">جاري تحميل مراجعة المحتوى...</div>}>
      <AssistantContentReviewContent />
    </Suspense>
  );
}
