"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAssistantCourse, getAssistantLessons } from "@/lib/assistant";
import { createClient } from "@/utils/supabase/client";
import { 
  ArrowRight, 
  Video, 
  FileText, 
  FileQuestion, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Edit2, 
  Plus, 
  X, 
  Check, 
  Loader2,
  ExternalLink
} from "lucide-react";

function AssistantLessonsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Homework Modal (Assistant can update homework PDF & details)
  const [showHwModal, setShowHwModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [savingHw, setSavingHw] = useState(false);

  const supabase = createClient();

  async function loadData() {
    if (!courseId) return;
    try {
      setLoading(true);
      const [courseData, lessonsData] = await Promise.all([
        getAssistantCourse(courseId),
        getAssistantLessons(courseId),
      ]);
      setCourse(courseData);
      setLessons(lessonsData || []);
    } catch (err: any) {
      console.error("فشل تحميل الدروس:", err.message);
      alert("تعذر الوصول لبيانات هذا الكورس: " + err.message);
      router.push("/assistant/courses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [courseId]);

  if (!courseId) {
    return (
      <div className="p-8 text-center" dir="rtl">
        <p className="text-red-500 font-bold mb-4">كود الكورس غير محدد.</p>
        <Link href="/assistant/courses" className="text-[#7D79F1] font-bold">العودة لقائمة الكورسات</Link>
      </div>
    );
  }

  function openHwModal(lesson: any) {
    setSelectedLesson(lesson);
    setPdfUrl(lesson.pdf_url || "");
    setShowHwModal(true);
  }

  async function handleSaveHomework(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLesson) return;

    try {
      setSavingHw(true);
      const { error } = await supabase
        .from("lessons")
        .update({ pdf_url: pdfUrl.trim() || null })
        .eq("id", selectedLesson.id);

      if (error) throw error;

      alert("تم حفظ الواجب والمرفق بنجاح 🎉");
      setShowHwModal(false);
      loadData();
    } catch (err: any) {
      alert("فشل حفظ الواجب: " + err.message);
    } finally {
      setSavingHw(false);
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/assistant/courses"
            className="p-3 bg-white border hover:bg-gray-50 rounded-2xl transition text-gray-500 shadow-sm"
          >
            <ArrowRight size={20} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D2B7A]">
              📖 محاضرات الكورس
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-semibold">
              الكورس: <span className="text-[#7D79F1] font-bold">{course?.title}</span>
            </p>
          </div>
        </div>

        <Link
          href={`/assistant/courses/exams?courseId=${courseId}`}
          className="bg-purple-50 hover:bg-purple-100 text-[#7D79F1] border border-purple-200 px-5 py-3 rounded-2xl transition font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
        >
          <FileQuestion size={16} />
          إدارة الامتحان الشامل للكورس
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border">
          <Loader2 className="animate-spin text-[#7D79F1] mx-auto mb-3" size={36} />
          <p className="text-gray-500 font-bold">جاري تحميل المحاضرات...</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white rounded-3xl border p-12 text-center text-gray-400">
          لم تتم إضافة أي محاضرات لهذا الكورس بعد.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden divide-y">
          {lessons.map((lesson, idx) => {
            const hasVideo = Boolean(lesson.video_url && lesson.video_url.trim() !== "");
            const hasQuiz = Boolean(lesson.quizzes && lesson.quizzes.length > 0);
            const hasHomework = Boolean(lesson.pdf_url && lesson.pdf_url.trim() !== "");

            return (
              <div
                key={lesson.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F3F2FF]/20 transition"
              >
                {/* Lesson Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#F3F2FF] text-[#7D79F1] font-black text-sm flex items-center justify-center shrink-0 border border-purple-100">
                    {lesson.order || idx + 1}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <h3 className="font-extrabold text-[#2D2B7A] text-base truncate">
                      {lesson.title}
                    </h3>
                    
                    {/* Status Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
                      {hasVideo ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          الفيديو: مرفوع
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                          <AlertCircle size={12} />
                          الفيديو: غير مرفوع
                        </span>
                      )}

                      {hasQuiz || hasHomework ? (
                        <span className="bg-purple-50 text-[#7D79F1] px-2.5 py-0.5 rounded-lg border border-purple-200 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          الواجب: مضاف
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-lg border border-gray-200 flex items-center gap-1">
                          <AlertCircle size={12} />
                          الواجب: غير مضاف
                        </span>
                      )}

                      {lesson.publish_at && new Date(lesson.publish_at) > new Date() && (
                        <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                          <Clock size={11} />
                          نشر مجدول: {new Date(lesson.publish_at).toLocaleDateString("ar-EG")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <Link
                    href={`/assistant/courses/exams?courseId=${courseId}&lessonId=${lesson.id}`}
                    className="py-2.5 px-4 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    <FileText size={14} />
                    {hasQuiz ? "تعديل أسئلة الواجب" : "إضافة واجب للدرس"}
                  </Link>

                  <button
                    onClick={() => openHwModal(lesson)}
                    className="py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border border-gray-200 cursor-pointer"
                    title="إرفاق مذكرة أو ملف PDF للشرح"
                  >
                    {hasHomework ? "تعديل المذكرة" : "إرفاق مذكرة"}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* HOMEWORK MODAL */}
      {showHwModal && selectedLesson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-extrabold text-[#2D2B7A] flex items-center gap-2">
                📝 واجب ومرفقات المحاضرة
              </h2>
              <button
                onClick={() => setShowHwModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveHomework} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">المحاضرة</label>
                <p className="font-bold text-[#2D2B7A] text-sm bg-gray-50 p-3 rounded-xl border">
                  {selectedLesson.title}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 flex justify-between items-center">
                  <span>رابط ملف الواجب أو المذكرة (PDF / Word)</span>
                  {uploadingPdf && <span className="text-[10px] text-[#7D79F1] animate-pulse">جاري الرفع...</span>}
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="رابط مباشر أو اضغط زر رفع ملف"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] font-medium text-xs dir-ltr text-right"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                  />
                  <label className="px-4 py-3 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold cursor-pointer transition text-xs shrink-0 flex items-center justify-center">
                    رفع ملف
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setUploadingPdf(true);
                          const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf";
                          const cleanFileName = `hw_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                          
                          const { data, error } = await supabase.storage
                            .from("teachers-images")
                            .upload(`lessons_attachments/${cleanFileName}`, file);

                          if (error) throw error;

                          const { data: { publicUrl } } = supabase.storage
                            .from("teachers-images")
                            .getPublicUrl(data.path);

                          setPdfUrl(publicUrl);
                          alert("تم رفع الملف بنجاح 🎉");
                        } catch (err: any) {
                          alert("فشل رفع الملف: " + err.message);
                        } finally {
                          setUploadingPdf(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={savingHw}
                  className="flex-1 py-3.5 bg-[#7D79F1] hover:bg-[#655EF0] disabled:bg-gray-300 text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  {savingHw ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  حفظ الواجب
                </button>
                <button
                  type="button"
                  onClick={() => setShowHwModal(false)}
                  className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-bold transition text-xs border cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AssistantLessonsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500 font-bold">جاري تحميل المحاضرات...</div>}>
      <AssistantLessonsContent />
    </Suspense>
  );
}
