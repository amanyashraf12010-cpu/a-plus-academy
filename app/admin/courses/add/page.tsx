"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addCourse, getTeachers } from "@/lib/admin";
import { ArrowRight, BookOpen, User, DollarSign, Image as ImageIcon, FileText, Clock, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function AddCoursePage() {
  const router = useRouter();

  const [teachers, setTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [grade, setGrade] = useState("الصف الأول الثانوي");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    async function loadTeachers() {
      try {
        const data = await getTeachers();
        setTeachers(data);
        if (data.length > 0) {
          setTeacherId(data[0].id);
        }
      } catch (error) {
        console.error("فشل تحميل المدرسين:", error);
      } finally {
        setLoadingTeachers(false);
      }
    }
    loadTeachers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !teacherId || !price || !subject.trim()) {
      alert("من فضلك املأ كل الحقول المطلوبة (اسم الكورس، المدرس، السعر، المادة)");
      return;
    }

    setSaving(true);

    const payload = {
      title,
      description,
      teacher_id: teacherId,
      price: parseFloat(price) || 0,
      image: image.trim() || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
      grade,
      subject,
      duration: duration || "غير محدد",
      video_count: 0
    };

    try {
      await addCourse(payload);
      alert("تم إضافة الكورس بنجاح 🎉");
      router.push("/admin/courses");
    } catch (error: any) {
      alert("فشل إضافة الكورس: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/courses"
          className="p-3 bg-white border hover:bg-gray-50 rounded-xl transition text-gray-500"
        >
          <ArrowRight size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-[#2D2B7A]">➕ إضافة كورس جديد</h1>
          <p className="text-gray-500 mt-1">أدخل تفاصيل الكورس الجديد لتقديمه للطلاب</p>
        </div>
      </div>

      {loadingTeachers ? (
        <div className="text-center py-12 text-gray-500 font-bold">جاري تحميل قائمة المدرسين لتخصيص الكورس...</div>
      ) : teachers.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center space-y-4">
          <p className="font-bold">تنبيه: يجب إضافة مدرس واحد على الأقل أولاً قبل إنشاء أي كورس!</p>
          <Link
            href="/admin/teachers"
            className="inline-block px-5 py-2.5 bg-[#7D79F1] text-white rounded-xl font-bold"
          >
            ذهاب لصفحة المدرسين
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-8 shadow-sm space-y-6 max-w-2xl">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <BookOpen size={14} /> اسم الكورس *
              </label>
              <input
                placeholder="مثال: مراجعة الفيزياء العامة - الباب الأول"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
              />
            </div>

            {/* Teacher Select */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <User size={14} /> المدرس المسؤول *
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-semibold bg-white cursor-pointer focus:border-[#7D79F1]"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                required
              >
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <DollarSign size={14} /> سعر الكورس (جنيه) *
              </label>
              <input
                type="number"
                placeholder="السعر بالجنيه (مثال: 150)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
              />
            </div>

            {/* Grade Select */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <GraduationCap size={14} /> الصف الدراسي *
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-semibold bg-white cursor-pointer focus:border-[#7D79F1]"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
              >
                <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <BookOpen size={14} /> المادة *
              </label>
              <input
                placeholder="مثال: فيزياء، كيمياء، لغة عربية"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <Clock size={14} /> مدة الكورس التقريبية
              </label>
              <input
                placeholder="مثال: 12 ساعة، 4 أسابيع"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
              />
            </div>

            {/* Cover Image URL */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <ImageIcon size={14} /> رابط صورة الغلاف
              </label>
              <input
                placeholder="اختياري (رابط مباشر للصورة)"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <FileText size={14} /> وصف الكورس
              </label>
              <textarea
                placeholder="اكتب وصفاً تفصيلياً لما سيتعلمه الطالب في هذا الكورس..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
              />
            </div>

          </div>

          {/* Buttons */}
          <div className="flex gap-4 border-t pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 px-6 bg-[#7D79F1] hover:bg-[#655EF0] disabled:bg-gray-300 text-white rounded-xl font-bold transition text-sm shadow-md"
            >
              {saving ? "جاري حفظ الكورس..." : "حفظ الكورس الجديد"}
            </button>
            <Link
              href="/admin/courses"
              className="flex-1 py-4 px-6 bg-gray-50 hover:bg-gray-100 text-center text-gray-500 border rounded-xl font-bold transition text-sm"
            >
              إلغاء
            </Link>
          </div>

        </form>
      )}

    </div>
  );
}