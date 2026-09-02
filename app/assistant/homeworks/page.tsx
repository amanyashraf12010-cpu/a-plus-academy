"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAssistantCourses, getAssistantLessons } from "@/lib/assistant";
import { createClient } from "@/utils/supabase/client";
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Loader2, 
  X, 
  Check,
  BookOpen
} from "lucide-react";

export default function AssistantHomeworksPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Homework Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  async function loadData() {
    try {
      setLoading(true);
      const coursesData = await getAssistantCourses();
      setCourses(coursesData || []);

      const courseIds = (coursesData || []).map((c: any) => c.id);
      if (courseIds.length === 0) {
        setLessons([]);
        return;
      }

      let query = supabase
        .from("lessons")
        .select(`
          id,
          course_id,
          title,
          order,
          pdf_url,
          created_at,
          courses:course_id (id, title)
        `)
        .in("course_id", courseIds)
        .order("order", { ascending: true });

      if (selectedCourseId !== "all") {
        query = query.eq("course_id", selectedCourseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLessons(data || []);
    } catch (err: any) {
      console.error("فشل تحميل الواجبات:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedCourseId]);

  function openEditModal(lesson: any) {
    setEditingLesson(lesson);
    setPdfUrl(lesson.pdf_url || "");
    setShowModal(true);
  }

  async function handleSaveHomework(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLesson) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("lessons")
        .update({ pdf_url: pdfUrl.trim() || null })
        .eq("id", editingLesson.id);

      if (error) throw error;

      alert("تم تحديث الواجب بنجاح 🎉");
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert("فشل حفظ الواجب: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteHomework(lessonId: string) {
    if (!confirm("هل أنتِ متأكدة من حذف ملف الواجب المرفق لهذا الدرس؟")) return;
    try {
      const { error } = await supabase
        .from("lessons")
        .update({ pdf_url: null })
        .eq("id", lessonId);

      if (error) throw error;
      alert("تم حذف الواجب.");
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
            <FileText className="text-[#7D79F1]" size={32} />
            الواجبات والمذكرات المرفقة
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-semibold">
            إرفاق ملفات ومذكرات الواجبات (PDF) مع المحاضرات ومتابعة رفعها
          </p>
        </div>
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

      {/* Table List */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border">
          <Loader2 className="animate-spin text-[#7D79F1] mx-auto mb-3" size={36} />
          <p className="text-gray-500 font-bold">جاري تحميل قائمة الواجبات...</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white rounded-3xl border p-12 text-center text-gray-400 font-medium">
          لا توجد محاضرات متاحة حالياً لإرفاق واجبات لها.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-[#F5F7FB] border-b text-[#2D2B7A] font-bold">
                <tr>
                  <th className="p-4">المحاضرة</th>
                  <th className="p-4">الكورس</th>
                  <th className="p-4 text-center">حالة الواجب</th>
                  <th className="p-4">ملف الواجب المرفق</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {lessons.map((lesson) => {
                  const hasHomework = Boolean(lesson.pdf_url && lesson.pdf_url.trim() !== "");
                  return (
                    <tr key={lesson.id} className="hover:bg-[#F3F2FF]/20 transition">
                      <td className="p-4 font-bold text-[#2D2B7A]">
                        {lesson.title}
                      </td>
                      <td className="p-4 text-xs font-semibold text-gray-600">
                        {lesson.courses?.title || "-"}
                      </td>
                      <td className="p-4 text-center">
                        {hasHomework ? (
                          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 text-xs font-bold inline-flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            مرفوع ومتاح للطلاب
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200 text-xs font-bold inline-flex items-center gap-1">
                            <AlertCircle size={12} />
                            غير مرفوع
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs">
                        {hasHomework ? (
                          <a
                            href={lesson.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[#7D79F1] hover:underline font-bold"
                          >
                            <FileText size={14} />
                            معاينة الملف المرفق
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-gray-400">لا يوجد ملف</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(lesson)}
                            className="p-2 rounded-xl bg-purple-50 text-[#7D79F1] hover:bg-purple-100 transition cursor-pointer font-bold text-xs flex items-center gap-1"
                            title="تعديل أو رفع واجب"
                          >
                            <Edit2 size={14} />
                            {hasHomework ? "تعديل" : "إرفاق واجب"}
                          </button>
                          {hasHomework && (
                            <button
                              onClick={() => handleDeleteHomework(lesson.id)}
                              className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                              title="حذف ملف الواجب"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showModal && editingLesson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-extrabold text-[#2D2B7A] flex items-center gap-2">
                📝 إرفاق واجب أو مذكرة للمحاضرة
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveHomework} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">المحاضرة</label>
                <p className="font-bold text-[#2D2B7A] text-sm bg-gray-50 p-3 rounded-xl border">
                  {editingLesson.title}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 flex justify-between items-center">
                  <span>رابط ملف الواجب (PDF / المستند)</span>
                  {uploadingPdf && <span className="text-[10px] text-[#7D79F1] animate-pulse">جاري الرفع...</span>}
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="رابط مباشر أو اضغطي زر رفع ملف"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] outline-none text-[#2D2B7A] font-medium text-xs dir-ltr text-right"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                  />
                  <label className="px-4 py-3 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold cursor-pointer transition text-xs shrink-0 flex items-center justify-center gap-1">
                    <UploadCloud size={14} />
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
                  disabled={saving}
                  className="flex-1 py-3.5 bg-[#7D79F1] hover:bg-[#655EF0] disabled:bg-gray-300 text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  حفظ الواجب
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
