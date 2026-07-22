"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getLessons, addLesson, updateLesson, deleteLesson } from "@/lib/admin";
import { createClient } from "@/utils/supabase/client";
import { Plus, Edit2, Trash2, ArrowRight, X, Play, MoveUp, MoveDown } from "lucide-react";
import Link from "next/link";

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
  const [order, setOrder] = useState("0");

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
    setOrder(String(lessons.length + 1));
    setShowModal(true);
  }

  function openEditModal(lesson: any) {
    setModalMode("edit");
    setSelectedLessonId(lesson.id);
    setTitle(lesson.title);
    setVideoUrl(lesson.video_url);
    setOrder(String(lesson.order));
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      alert("من فضلك املأ جميع الحقول المطلوبة (عنوان الدرس ورابط الفيديو)");
      return;
    }

    const payload = {
      course_id: courseId!,
      title,
      video_url: videoUrl,
      order: parseInt(order) || 0
    };

    try {
      if (modalMode === "add") {
        await addLesson(payload);
        
        // Update course video count
        await supabase
          .from("courses")
          .update({ video_count: lessons.length + 1 })
          .eq("id", courseId);

        alert("تم إضافة الدرس بنجاح.");
      } else if (modalMode === "edit" && selectedLessonId) {
        await updateLesson(selectedLessonId, {
          title,
          video_url: videoUrl,
          order: parseInt(order) || 0
        });
        alert("تم تحديث الدرس بنجاح.");
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/courses"
            className="p-3 bg-white border hover:bg-gray-50 rounded-xl transition text-gray-500"
          >
            <ArrowRight size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-[#2D2B7A]">📖 إدارة دروس الكورس</h1>
            <p className="text-gray-500 mt-1">كورس: <span className="font-bold text-[#7D79F1]">{courseTitle}</span></p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#7D79F1] hover:bg-[#655EF0] text-white px-5 py-3 rounded-xl transition flex items-center gap-2 font-bold shadow-md shadow-[#7D79F1]/20"
        >
          <Plus size={20} />
          إضافة درس جديد
        </button>
      </div>

      {/* Lessons List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-bold">جاري تحميل الدروس...</div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white border rounded-2xl p-8">
          لا توجد دروس مضافة لهذا الكورس حالياً. اضغط "إضافة درس جديد" للبدء.
        </div>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden divide-y">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="p-5 flex items-center justify-between hover:bg-[#F3F2FF]/20 transition"
            >
              <div className="flex items-center gap-4">
                {/* Order circle */}
                <div className="w-10 h-10 rounded-full bg-[#F3F2FF] text-[#7D79F1] font-bold flex items-center justify-center border border-[#7D79F1]/20">
                  {lesson.order || index + 1}
                </div>
                <div>
                  <h3 className="font-bold text-[#2D2B7A] text-lg">{lesson.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 dir-ltr text-right line-clamp-1">{lesson.video_url}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openEditModal(lesson)}
                  className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                  title="تعديل الدرس"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-extrabold text-[#2D2B7A]">
                {modalMode === "add" ? "➕ إضافة درس جديد" : "📝 تعديل الدرس"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">عنوان الدرس *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الدرس الأول - مقدمة عامة"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">رابط الفيديو أو مسار الملف *</label>
                <input
                  type="text"
                  required
                  placeholder="رابط يوتيوب/فيميو أو مسار في Supabase Storage"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  اكتب رابط فيديو كامل (يبدأ بـ http) للاستضافة الخارجية، أو مسار الملف لـ Supabase Private bucket.
                </p>
              </div>

              {/* Order */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">ترتيب الدرس الكلي *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold transition text-sm shadow-md"
                >
                  حفظ الدرس
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
