"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCourses, deleteCourse } from "@/lib/admin";
import { Plus, BookOpen, Trash2, Edit2, Play } from "lucide-react";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCourses() {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
    } catch (error) {
      console.error("فشل تحميل الكورسات:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكورس وجميع دروسه نهائياً؟")) return;
    try {
      await deleteCourse(id);
      alert("تم حذف الكورس بنجاح.");
      loadCourses();
    } catch (error: any) {
      alert("فشل الحذف: " + error.message);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2D2B7A]">📚 إدارة الكورسات</h1>
          <p className="text-gray-500 mt-2">عرض وإضافة وتعديل وحذف الكورسات الدراسية المتاحة على المنصة</p>
        </div>

        <Link
          href="/admin/courses/add"
          className="bg-[#7D79F1] hover:bg-[#655EF0] text-white px-5 py-3 rounded-xl transition flex items-center gap-2 font-bold shadow-md shadow-[#7D79F1]/20"
        >
          <Plus size={20} />
          إضافة كورس جديد
        </Link>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-bold">جاري تحميل الكورسات...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">لا توجد كورسات مضافة حالياً. اضغط "إضافة كورس جديد" للبدء.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="w-full h-40 rounded-xl overflow-hidden bg-gray-100 border relative mb-4">
                  <img
                    src={course.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600"}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-[#2D2B7A] text-white px-2 py-1 rounded-lg text-xs font-bold">
                    {course.price > 0 ? `${course.price} جنيه` : "مجاني"}
                  </div>
                </div>

                <h2 className="text-xl font-bold text-[#2D2B7A] line-clamp-1">{course.title}</h2>
                <p className="text-sm text-gray-500 mt-1">👨‍🏫 المدرس: {course.teachers?.name || "غير محدد"}</p>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">{course.description || "لا يوجد وصف لهذا الكورس."}</p>

                <div className="flex gap-4 mt-4 pt-3 border-t text-xs text-gray-500">
                  <span>📚 المادة: {course.subject}</span>
                  <span>🎓 الصف: {course.grade}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6 border-t pt-4">
                <Link
                  href={`/admin/lesson?courseId=${course.id}`}
                  className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-[#7D79F1] transition rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Play size={14} />
                  الدروس ({course.video_count || 0})
                </Link>

                <button
                  onClick={() => handleDelete(course.id)}
                  className="p-2 bg-red-50 text-red-600 hover:bg-red-100 transition rounded-xl"
                  title="حذف الكورس"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}