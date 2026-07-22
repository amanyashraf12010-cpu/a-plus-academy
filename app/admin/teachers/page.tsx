"use client";

import { useEffect, useState } from "react";
import { getTeachers, addTeacher, updateTeacher, deleteTeacher } from "@/lib/admin";
import { Plus, Edit2, Trash2, GraduationCap, X, Book } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const supabase = createClient();

  // Form states
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [educationSystem, setEducationSystem] = useState("general");
  const [grade, setGrade] = useState("");
  const [track, setTrack] = useState("");

  async function loadTeachers() {
    try {
      setLoading(true);
      const data = await getTeachers();
      setTeachers(data);
    } catch (error) {
      console.error("فشل تحميل المدرسين:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  function openAddModal() {
    setModalMode("add");
    setSelectedId(null);
    setName("");
    setImage("");
    setImageFile(null);
    setSubject("");
    setDescription("");
    setEducationSystem("general");
    setGrade("الصف الأول الثانوي");
    setTrack("علمي علوم");
    setShowModal(true);
  }

  function openEditModal(teacher: any) {
    setModalMode("edit");
    setSelectedId(teacher.id);
    setName(teacher.name || "");
    setImage(teacher.image || "");
    setImageFile(null);
    setSubject(teacher.subject || "");
    setDescription(teacher.description || "");
    setEducationSystem(teacher.education_system || "general");
    setGrade(teacher.grade || "الصف الأول الثانوي");
    setTrack(teacher.track || "علمي علوم");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert("اسم المدرس مطلوب");
      return;
    }

    try {
      let finalImageUrl = image;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `teacher_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("teachers-images")
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw new Error("فشل رفع صورة المدرس: " + uploadError.message);
        
        const { data } = supabase.storage
          .from("teachers-images")
          .getPublicUrl(filePath);
          
        finalImageUrl = data.publicUrl;
      }

      const payload = {
        name,
        image: finalImageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
        subject,
        description,
        education_system: educationSystem,
        grade,
        track,
      };

      if (modalMode === "add") {
        await addTeacher(payload);
        alert("تم إضافة المدرس بنجاح.");
      } else if (modalMode === "edit" && selectedId) {
        await updateTeacher(selectedId, payload);
        alert("تم تحديث بيانات المدرس بنجاح.");
      }
      setShowModal(false);
      loadTeachers();
    } catch (error: any) {
      alert("فشل الحفظ: " + error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المدرس نهائياً؟ سيتم حذف جميع الكورسات المرتبطة به.")) return;
    try {
      await deleteTeacher(id);
      alert("تم حذف المدرس بنجاح.");
      loadTeachers();
    } catch (error: any) {
      alert("فشل الحذف: " + error.message);
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2D2B7A]">👨‍🏫 إدارة المدرسين</h1>
          <p className="text-gray-500 mt-2">إضافة وتعديل وحذف المدرسين العاملين بالمنصة وتخصصاتهم</p>
        </div>
        
        <button
          onClick={openAddModal}
          className="bg-[#7D79F1] hover:bg-[#655EF0] text-white px-5 py-3 rounded-xl transition flex items-center gap-2 font-bold shadow-md shadow-[#7D79F1]/20"
        >
          <Plus size={20} />
          إضافة مدرس جديد
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-bold">جاري تحميل قائمة المدرسين...</div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">لا يوجد مدرسين مسجلين حالياً. اضغط "إضافة مدرس جديد" للبدء.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-200"
            >
              <div>
                <div className="flex items-center gap-4 border-b pb-4 mb-4">
                  <img
                    src={teacher.image}
                    alt={teacher.name}
                    className="w-16 h-16 rounded-2xl object-cover bg-gray-100 border-2 border-[#7D79F1]/20"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-[#2D2B7A]">{teacher.name}</h2>
                    <span className="text-xs bg-purple-50 text-[#7D79F1] border border-purple-200 px-2 py-0.5 rounded-lg font-semibold inline-block mt-1">
                      {teacher.subject}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <p className="line-clamp-2">{teacher.description || "لا يوجد وصف حالياً لهذا المدرس."}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                      {teacher.grade}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                      {teacher.education_system === "general" ? "عام" : "أزهر"} - {teacher.track}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t pt-4">
                <button
                  onClick={() => openEditModal(teacher)}
                  className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 hover:bg-blue-100 transition rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Edit2 size={14} />
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(teacher.id)}
                  className="flex-1 py-2 px-3 bg-red-50 text-red-600 hover:bg-red-100 transition rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-extrabold text-[#2D2B7A]">
                {modalMode === "add" ? "➕ إضافة مدرس جديد" : "📝 تعديل بيانات المدرس"}
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
              
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">اسم المدرس ثلاثي</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أ. محمد أحمد"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">المادة المدرسّة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: رياضيات، فيزياء..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                {/* Image File Upload */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">صورة المدرس الشخصية</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] transition font-medium file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F3F2FF] file:text-[#7D79F1] hover:file:bg-[#7D79F1]/10 text-xs cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setImageFile(file);
                    }}
                  />
                </div>

                {/* Education System */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">نظام التعليم</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-semibold bg-white cursor-pointer focus:border-[#7D79F1]"
                    value={educationSystem}
                    onChange={(e) => setEducationSystem(e.target.value)}
                  >
                    <option value="general">ثانوي عام</option>
                    <option value="azhar">ثانوي أزهر</option>
                  </select>
                </div>

                {/* Grade */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">الصف الدراسي</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-semibold bg-white cursor-pointer focus:border-[#7D79F1]"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  >
                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                    <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                    <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                  </select>
                </div>

                {/* Track */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">التخصص</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-semibold bg-white cursor-pointer focus:border-[#7D79F1]"
                    value={track}
                    onChange={(e) => setTrack(e.target.value)}
                  >
                    {educationSystem === "general" ? (
                      <>
                        <option value="علمي علوم">علمي علوم</option>
                        <option value="علمي رياضة">علمي رياضة</option>
                        <option value="أدبي">أدبي</option>
                      </>
                    ) : (
                      <>
                        <option value="علمي أزهر">علمي أزهر</option>
                        <option value="أدبي أزهر">أدبي أزهر</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">نبذة تعريفية للمدرس</label>
                  <textarea
                    rows={3}
                    placeholder="اكتب نبذة مختصرة عن خبرة المدرس لكي تظهر للطلاب في الكورس..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold transition text-sm shadow-md"
                >
                  حفظ البيانات
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
