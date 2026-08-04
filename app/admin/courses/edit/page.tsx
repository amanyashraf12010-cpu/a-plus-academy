"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCourse, updateCourse, getTeachers } from "@/lib/admin";
import { ArrowRight, BookOpen, User, DollarSign, Image as ImageIcon, FileText, Clock, GraduationCap } from "lucide-react";
import Link from "next/link";

function EditCourseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("id");

  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!courseId) {
        alert("معرف الكورس غير موجود!");
        router.push("/admin/courses");
        return;
      }

      try {
        setLoading(true);
        // Load teachers
        const teachersList = await getTeachers();
        setTeachers(teachersList);

        // Load course details
        const courseData = await getCourse(courseId);
        setTitle(courseData.title);
        setDescription(courseData.description || "");
        setTeacherId(courseData.teacher_id);
        setPrice(courseData.price.toString());
        setImage(courseData.image || "");
        setSubject(courseData.subject || "");
        setDuration(courseData.duration || "");

        // Set grades
        if (courseData.grade) {
          setSelectedGrades(courseData.grade.split(",").map((g: string) => g.trim()));
        } else {
          setSelectedGrades(["الصف الأول الثانوي"]);
        }
      } catch (error) {
        console.error("فشل تحميل البيانات:", error);
        alert("حدث خطأ أثناء تحميل تفاصيل الكورس.");
        router.push("/admin/courses");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [courseId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    if (!title.trim() || !teacherId || !price || !subject.trim()) {
      alert("من فضلك املأ كل الحقول المطلوبة (اسم الكورس، المدرس، السعر، المادة)");
      return;
    }

    if (selectedGrades.length === 0) {
      alert("من فضلك اختر صفاً دراسياً واحداً على الأقل للكورس.");
      return;
    }

    setSaving(true);

    const payload = {
      title,
      description,
      teacher_id: teacherId,
      price: parseFloat(price) || 0,
      image: image.trim() || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
      grade: selectedGrades.join(","),
      subject,
      duration: duration || "غير محدد",
    };

    try {
      await updateCourse(courseId, payload);
      alert("تم تعديل الكورس بنجاح 🎉");
      router.push("/admin/courses");
    } catch (error: any) {
      alert("فشل تعديل الكورس: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 font-bold">جاري تحميل تفاصيل الكورس...</div>;
  }

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
          <h1 className="text-3xl font-extrabold text-[#2D2B7A]">✏️ تعديل الكورس</h1>
          <p className="text-gray-500 mt-1">تحديث وتعديل تفاصيل الكورس الحالي</p>
        </div>
      </div>

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
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
              <GraduationCap size={14} /> الصف الدراسي * (يمكن اختيار أكثر من صف للكورسات المشتركة/التأسيسية)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              {[
                "الصف الأول الثانوي",
                "الصف الثاني الثانوي",
                "الصف الثالث الثانوي"
              ].map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm text-[#2D2B7A] font-black cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedGrades.includes(g)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGrades([...selectedGrades, g]);
                      } else {
                        setSelectedGrades(selectedGrades.filter((item) => item !== g));
                      }
                    }}
                    className="w-4.5 h-4.5 text-[#7D79F1] focus:ring-[#7D79F1]/20 border-gray-300 rounded cursor-pointer"
                  />
                  {g}
                </label>
              ))}
            </div>
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
          <div className="md:col-span-2">
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
            {saving ? "جاري حفظ التعديلات..." : "حفظ التعديلات"}
          </button>
          <Link
            href="/admin/courses"
            className="flex-1 py-4 px-6 bg-gray-50 hover:bg-gray-100 text-center text-gray-500 border rounded-xl font-bold transition text-sm"
          >
            إلغاء
          </Link>
        </div>

      </form>
    </div>
  );
}

export default function EditCoursePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500 font-bold">جاري تحميل الصفحة...</div>}>
      <EditCourseForm />
    </Suspense>
  );
}
