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
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  // Form states
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [order, setOrder] = useState<number>(0);

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
    setAbout("");
    setSelectedSystems(["general"]);
    setSelectedGrades(["الصف الأول الثانوي"]);
    setSelectedTracks(["عام"]);
    setOrder(0);
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
    setAbout(teacher.about || "");
    setSelectedSystems(teacher.education_system ? teacher.education_system.split(",") : ["general"]);
    setSelectedGrades(teacher.grade ? teacher.grade.split(",") : ["الصف الأول الثانوي"]);
    setSelectedTracks(teacher.track ? teacher.track.split(",") : ["عام"]);
    setOrder(Number(teacher.order) || 0);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert("اسم المدرس مطلوب");
      return;
    }

    if (selectedGrades.length === 0) {
      alert("من فضلك اختر صفاً دراسياً واحداً على الأقل للمدرس.");
      return;
    }
    if (selectedSystems.length === 0) {
      alert("من فضلك اختر نظاماً تعليمياً واحداً على الأقل للمدرس.");
      return;
    }

    try {
      setSaving(true);
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
        about,
        education_system: selectedSystems.join(","),
        grade: selectedGrades.join(","),
        track: selectedGrades.includes("الصف الأول الثانوي") && !selectedTracks.includes("عام")
          ? [...selectedTracks, "عام"].join(",")
          : selectedTracks.join(","),
        order: Number(order) || 0,
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
    } finally {
      setSaving(false);
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
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[#2D2B7A]">{teacher.name}</h2>
                      <span className="text-[10px] bg-gray-100 text-gray-500 border px-1.5 py-0.5 rounded-md font-bold">
                        ترتيب: {teacher.order ?? 0}
                      </span>
                    </div>
                    <span className="text-xs bg-purple-50 text-[#7D79F1] border border-purple-200 px-2 py-0.5 rounded-lg font-semibold inline-block mt-1">
                      {teacher.subject}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <p className="line-clamp-2">{teacher.description || "لا يوجد وصف حالياً لهذا المدرس."}</p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {teacher.grade && teacher.grade.split(",").map((g: string) => (
                      <span key={g} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                        {g.replace("الصف ", "")}
                      </span>
                    ))}
                    {teacher.education_system && teacher.education_system.split(",").map((sys: string) => {
                      const mapSystemLabel = (s: string) => {
                        if (s === "general") return "عام";
                        if (s === "azhar") return "أزهر";
                        if (s === "general_baccalaureate") return "عام (بكالوريا)";
                        if (s === "azhar_baccalaureate") return "أزهر (بكالوريا)";
                        return s;
                      };
                      return (
                        <span key={sys} className="text-xs bg-purple-50 text-[#7D79F1] border border-purple-150 px-2.5 py-1 rounded-lg font-semibold">
                          {mapSystemLabel(sys)}
                        </span>
                      );
                    })}
                    {teacher.track && teacher.track.split(",").filter((t: string) => t !== "عام").map((t: string) => (
                      <span key={t} className="text-xs bg-blue-50 text-blue-600 border border-blue-150 px-2.5 py-1 rounded-lg font-medium">
                        {t}
                      </span>
                    ))}
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
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
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

                {/* Order */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">ترتيب الظهور (رقمي)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="أصغر رقم يظهر أولاً"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value) || 0)}
                  />
                </div>

                {/* Education System */}
                <div className="col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">نظام التعليم (يمكن اختيار أكثر من نظام)</label>
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl border border-gray-150">
                    <label className="flex items-center gap-2 text-sm text-[#2D2B7A] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSystems.includes("general")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSystems([...selectedSystems, "general"]);
                          } else {
                            setSelectedSystems(selectedSystems.filter(s => s !== "general"));
                          }
                        }}
                        className="w-4.5 h-4.5 text-[#7D79F1] focus:ring-[#7D79F1]/20 border-gray-300 rounded cursor-pointer"
                      />
                      ثانوي عام
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#2D2B7A] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSystems.includes("azhar")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSystems([...selectedSystems, "azhar"]);
                          } else {
                            setSelectedSystems(selectedSystems.filter(s => s !== "azhar"));
                          }
                        }}
                        className="w-4.5 h-4.5 text-[#7D79F1] focus:ring-[#7D79F1]/20 border-gray-300 rounded cursor-pointer"
                      />
                      ثانوي أزهر
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#2D2B7A] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSystems.includes("general_baccalaureate")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSystems([...selectedSystems, "general_baccalaureate"]);
                          } else {
                            setSelectedSystems(selectedSystems.filter(s => s !== "general_baccalaureate"));
                          }
                        }}
                        className="w-4.5 h-4.5 text-[#7D79F1] focus:ring-[#7D79F1]/20 border-gray-300 rounded cursor-pointer"
                      />
                      ثانوي عام (بكالوريا)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#2D2B7A] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSystems.includes("azhar_baccalaureate")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSystems([...selectedSystems, "azhar_baccalaureate"]);
                          } else {
                            setSelectedSystems(selectedSystems.filter(s => s !== "azhar_baccalaureate"));
                          }
                        }}
                        className="w-4.5 h-4.5 text-[#7D79F1] focus:ring-[#7D79F1]/20 border-gray-300 rounded cursor-pointer"
                      />
                      ثانوي أزهر (بكالوريا)
                    </label>
                  </div>
                </div>

                {/* Grade */}
                <div className="col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">الصفوف الدراسية (يمكن اختيار أكثر من صف)</label>
                  <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-150">
                    <label className="flex items-center gap-2 text-sm text-[#2D2B7A] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGrades.includes("الصف الأول الثانوي")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGrades([...selectedGrades, "الصف الأول الثانوي"]);
                          } else {
                            setSelectedGrades(selectedGrades.filter(g => g !== "الصف الأول الثانوي"));
                          }
                        }}
                        className="w-4.5 h-4.5 text-[#7D79F1] focus:ring-[#7D79F1]/20 border-gray-300 rounded cursor-pointer"
                      />
                      أولى ثانوي
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#2D2B7A] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGrades.includes("الصف الثاني الثانوي")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGrades([...selectedGrades, "الصف الثاني الثانوي"]);
                          } else {
                            setSelectedGrades(selectedGrades.filter(g => g !== "الصف الثاني الثانوي"));
                          }
                        }}
                        className="w-4.5 h-4.5 text-[#7D79F1] focus:ring-[#7D79F1]/20 border-gray-300 rounded cursor-pointer"
                      />
                      تانية ثانوي
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#2D2B7A] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGrades.includes("الصف الثالث الثانوي")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGrades([...selectedGrades, "الصف الثالث الثانوي"]);
                          } else {
                            setSelectedGrades(selectedGrades.filter(g => g !== "الصف الثالث الثانوي"));
                          }
                        }}
                        className="w-4.5 h-4.5 text-[#7D79F1] focus:ring-[#7D79F1]/20 border-gray-300 rounded cursor-pointer"
                      />
                      تالتة ثانوي
                    </label>
                  </div>
                </div>

                {/* Track */}
                {((selectedGrades.includes("الصف الثاني الثانوي")) || (selectedGrades.includes("الصف الثالث الثانوي"))) && (
                  <div className="col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">التخصص / الشعبة</label>
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
                      
                      {/* Second Grade Tracks */}
                      {selectedGrades.includes("الصف الثاني الثانوي") && (
                        <div className="col-span-2 space-y-2 border-b border-gray-200 pb-3 mb-2">
                          <p className="text-xs font-bold text-gray-400">تخصصات الصف الثاني الثانوي:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              "مسار الطب وعلوم الحياة",
                              "مسار الهندسة وعلوم الحاسب",
                              "مسار الأعمال",
                              "مسار الآداب والفنون التطبيقية"
                            ].map(t => (
                              <label key={t} className="flex items-center gap-2 text-sm text-[#2D2B7A] font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedTracks.includes(t)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTracks([...selectedTracks, t]);
                                    } else {
                                      setSelectedTracks(selectedTracks.filter(x => x !== t));
                                    }
                                  }}
                                  className="w-4 h-4 text-[#7D79F1] focus:ring-[#7D79F1]/20 border-gray-300 rounded cursor-pointer"
                                />
                                {t}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Third Grade Tracks */}
                      {selectedGrades.includes("الصف الثالث الثانوي") && (
                        <div className="col-span-2 space-y-2">
                          <p className="text-xs font-bold text-gray-400">تخصصات الصف الثالث الثانوي:</p>
                          
                          {/* General Third Grade Tracks */}
                          {selectedSystems.includes("general") && (
                            <div className="space-y-1.5 bg-white p-2.5 rounded-lg border mb-2">
                              <p className="text-xs text-[#7D79F1] font-bold">ثانوي عام:</p>
                              <div className="flex flex-wrap gap-4">
                                {["علمي علوم", "علمي رياضة", "أدبي"].map(t => (
                                  <label key={t} className="flex items-center gap-2 text-sm text-[#2D2B7A] font-medium cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedTracks.includes(t)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedTracks([...selectedTracks, t]);
                                        } else {
                                          setSelectedTracks(selectedTracks.filter(x => x !== t));
                                        }
                                      }}
                                      className="w-4 h-4 text-[#7D79F1] focus:ring-[#7D79F1]/20 border-gray-300 rounded cursor-pointer"
                                    />
                                    {t}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Azhar Third Grade Tracks */}
                          {selectedSystems.includes("azhar") && (
                            <div className="space-y-1.5 bg-white p-2.5 rounded-lg border">
                              <p className="text-xs text-[#7D79F1] font-bold">ثانوي أزهر:</p>
                              <div className="flex flex-wrap gap-4">
                                {["علمي أزهر", "أدبي أزهر"].map(t => (
                                  <label key={t} className="flex items-center gap-2 text-sm text-[#2D2B7A] font-medium cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedTracks.includes(t)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedTracks([...selectedTracks, t]);
                                        } else {
                                          setSelectedTracks(selectedTracks.filter(x => x !== t));
                                        }
                                      }}
                                      className="w-4 h-4 text-[#7D79F1] focus:ring-[#7D79F1]/20 border-gray-300 rounded cursor-pointer"
                                    />
                                    {t === "علمي أزهر" ? "علمي (أزهر)" : "أدبي (أزهر)"}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  </div>
                )}

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

                {/* About */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">الوصف التفصيلي للمدرس (عن المدرس / السيرة الذاتية)</label>
                  <textarea
                    rows={5}
                    placeholder="اكتب وصفاً تفصيلياً عن المدرس، خبراته وإنجازاته، سيظهر للطلاب في صفحة المدرس الخاصة..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 px-4 bg-[#7D79F1] hover:bg-[#655EF0] disabled:bg-gray-300 text-white rounded-xl font-bold transition text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      جاري حفظ البيانات...
                    </>
                  ) : (
                    "حفظ البيانات"
                  )}
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
