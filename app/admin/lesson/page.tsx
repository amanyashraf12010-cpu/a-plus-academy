"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getLessons, addLesson, updateLesson, deleteLesson } from "@/lib/admin";
import { createClient } from "@/utils/supabase/client";
import { Plus, Edit2, Trash2, ArrowRight, X, Play, MoveUp, MoveDown, Clock, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import VideoPreviewField from "@/components/admin/VideoPreviewField";

function LessonsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [courseTitle, setCourseTitle] = useState("");
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isVideoVerified, setIsVideoVerified] = useState(false);
  const [order, setOrder] = useState("0");
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [publishAt, setPublishAt] = useState("");

  const formatDateTimeLocal = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const supabase = createClient();

  // Load Course and Lessons
  async function loadData() {
    if (!courseId) return;
    try {
      setLoading(true);
      
      // Fetch Course Title
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .single();
        
      if (courseError) throw courseError;
      setCourseTitle(course.title);

      // Fetch Lessons
      const lessonsData = await getLessons(courseId);
      setLessons(lessonsData);
    } catch (error) {
      console.error("فشل تحميل الدروس:", error);
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
        <p className="text-red-500 font-bold mb-4">كود الكورس غير صحيح أو غير متوفر.</p>
        <Link href="/admin/courses" className="text-[#7D79F1] font-bold">العودة لصفحة الكورسات</Link>
      </div>
    );
  }

  function openAddModal() {
    setModalMode("add");
    setSelectedLessonId(null);
    setTitle("");
    setVideoUrl("");
    setIsVideoVerified(false);
    setPdfUrl("");
    setPublishAt("");
    setOrder(String(lessons.length + 1));
    setShowModal(true);
  }

  function openEditModal(lesson: any) {
    setModalMode("edit");
    setSelectedLessonId(lesson.id);
    setTitle(lesson.title);
    setVideoUrl(lesson.video_url);
    setIsVideoVerified(Boolean(lesson.video_verified || (lesson.video_url && lesson.video_url.trim() !== "")));
    setPdfUrl(lesson.pdf_url || "");
    setPublishAt(lesson.publish_at ? formatDateTimeLocal(lesson.publish_at) : "");
    setOrder(String(lesson.order));
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      alert("من فضلك املأ جميع الحقول المطلوبة (عنوان الدرس ورابط الفيديو)");
      return;
    }

    // Video verification guard
    if (!isVideoVerified) {
      alert("⚠️ يرجى معاينة الفيديو والتأكد من أنه الفيديو الصحيح قبل الحفظ بالضغط على زر «✅ الفيديو صحيح — تأكيد».");
      return;
    }

    const payload = {
      course_id: courseId!,
      title,
      video_url: videoUrl,
      order: parseInt(order) || 0,
      pdf_url: pdfUrl.trim() || undefined,
      publish_at: publishAt ? new Date(publishAt).toISOString() : null,
      video_verified: isVideoVerified
    };

    try {
      if (modalMode === "add") {
        await addLesson(payload);
        
        // Update course video count
        await supabase
          .from("courses")
          .update({ video_count: lessons.length + 1 })
          .eq("id", courseId);

        alert("تم إضافة الدرس وتأكيد الفيديو بنجاح 🎉");
      } else if (modalMode === "edit" && selectedLessonId) {
        await updateLesson(selectedLessonId, {
          title,
          video_url: videoUrl,
          order: parseInt(order) || 0,
          pdf_url: pdfUrl.trim() || undefined,
          publish_at: publishAt ? new Date(publishAt).toISOString() : null,
          video_verified: isVideoVerified
        });
        alert("تم تحديث الدرس وتأكيد الفيديو بنجاح 🎉");
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      alert("فشل الحفظ: " + error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الدرس نهائياً؟")) return;
    try {
      await deleteLesson(id);
      
      // Update course video count
      await supabase
        .from("courses")
        .update({ video_count: Math.max(0, lessons.length - 1) })
        .eq("id", courseId);

      alert("تم حذف الدرس بنجاح.");
      loadData();
    } catch (error: any) {
      alert("فشل الحذف: " + error.message);
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/courses"
            className="p-3 bg-white border hover:bg-gray-50 rounded-xl transition text-gray-500"
          >
            <ArrowRight size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-[#2D2B7A]">
              إدارة دروس: <span className="text-[#7D79F1]">{courseTitle}</span>
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              إضافة وتعديل دروس الكورس وروابط الفيديوهات والمذكرات المرفقة
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#7D79F1] hover:bg-[#655EF0] text-white px-5 py-3 rounded-xl font-bold transition shadow-sm w-fit"
        >
          <Plus size={18} />
          إضافة درس جديد
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-bold">جاري تحميل الدروس...</div>
      ) : lessons.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-400">
          لم تتم إضافة أي دروس لهذا الكورس بعد.
        </div>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden divide-y">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="p-5 flex items-center justify-between hover:bg-[#F3F2FF]/20 transition gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Order circle */}
                <div className="w-10 h-10 rounded-full bg-[#F3F2FF] text-[#7D79F1] font-bold flex items-center justify-center border border-[#7D79F1]/20 shrink-0">
                  {lesson.order || index + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[#2D2B7A] text-lg truncate">{lesson.title}</h3>
                    
                    {/* Video Verification Badge */}
                    {lesson.video_verified ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-lg border border-emerald-200 font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        فيديو مؤكد ✅
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-lg border border-amber-200 font-bold flex items-center gap-1">
                        <AlertCircle size={11} className="text-amber-600" />
                        يحتاج مراجعة ⚠️
                      </span>
                    )}

                    {lesson.publish_at && new Date(lesson.publish_at) > new Date() && (
                      <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 rounded-lg border border-amber-200 font-bold flex items-center gap-1">
                        <Clock size={10} />
                        مجدولة: {new Date(lesson.publish_at).toLocaleString("ar-EG")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 dir-ltr text-right truncate">{lesson.video_url}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/admin/courses/exams?courseId=${courseId}&lessonId=${lesson.id}`}
                  className="py-2 px-3 bg-purple-50 hover:bg-purple-100 text-[#7D79F1] transition rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                  title="إدارة واجب الدرس"
                >
                  📚 الواجب
                </Link>
                <button
                  onClick={() => openEditModal(lesson)}
                  className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                  title="تعديل الدرس ومعاينة الفيديو"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(lesson.id)}
                  className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                  title="حذف الدرس"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal with Video Preview and Confirmation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-[#F8F9FD]">
              <h2 className="text-lg font-extrabold text-[#2D2B7A] flex items-center gap-2">
                {modalMode === "add" ? "➕ إضافة درس جديد ومعاينة الفيديو" : "📝 تعديل الدرس ومراجعة الفيديو"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Scrollable */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">عنوان الدرس *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الدرس الأول - مقدمة عامة"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Video URL with Integrated Preview & Confirmation */}
              <div className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl">
                <VideoPreviewField
                  value={videoUrl}
                  onChange={setVideoUrl}
                  isVerified={isVideoVerified}
                  onVerifiedChange={setIsVideoVerified}
                  initialVerified={modalMode === "edit"}
                />
              </div>

              {/* PDF Attachment URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex justify-between items-center">
                  <span>رابط ملف PDF أو المرفق (اختياري)</span>
                  {uploadingPdf && <span className="text-[10px] text-[#7D79F1] animate-pulse">جاري الرفع...</span>}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="رابط مباشر للملف أو مسار التحميل"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium text-xs"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                  />
                  <label className="px-3 py-3 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold cursor-pointer transition text-[10px] shrink-0 flex items-center justify-center">
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
                          const cleanFileName = `file_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                          
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

              {/* Order */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">ترتيب الدرس الكلي *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium text-sm"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                />
              </div>

              {/* Publish At (Scheduling) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">تاريخ ووقت النشر تلقائياً (اختياري)</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium text-sm"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  اتركها فارغة لنشر المحاضرة فوراً. حدد تاريخاً ووقتاً في المستقبل لجدولتها.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t shrink-0">
                <button
                  type="submit"
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition text-sm shadow-md flex items-center justify-center gap-2 ${
                    !isVideoVerified && videoUrl.trim() !== ""
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300"
                      : "bg-[#7D79F1] hover:bg-[#655EF0] text-white cursor-pointer"
                  }`}
                >
                  <ShieldCheck size={16} />
                  <span>{isVideoVerified ? "حفظ الدرس (مؤكد ✅)" : "حفظ الدرس"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-bold transition text-sm border"
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

export default function AdminLessonsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500 font-bold">جاري تحميل صفحة إدارة الدروس...</div>}>
      <LessonsContent />
    </Suspense>
  );
}
