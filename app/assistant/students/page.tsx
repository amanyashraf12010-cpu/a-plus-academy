"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { getAssistantStudents, AssistantStudentItem } from "@/lib/assistant";
import { 
  Users, 
  Search, 
  Phone, 
  BookOpen, 
  Loader2, 
  ArrowRight,
  GraduationCap,
  Eye,
  User
} from "lucide-react";

function AssistantStudentsContent() {
  const [students, setStudents] = useState<AssistantStudentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getAssistantStudents();
      setStudents(data || []);
    } catch (err: any) {
      console.error("فشل تحميل قائمة الطلاب:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchesName = s.fullName.toLowerCase().includes(q);
    const matchesPhone = s.phone.includes(q);
    const matchesParentPhone = s.parentPhone.includes(q);
    const matchesCourse = s.enrolledCourses.some((c) => c.title.toLowerCase().includes(q));
    return matchesName || matchesPhone || matchesParentPhone || matchesCourse;
  });

  return (
    <div className="space-y-8 max-w-6xl" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2D2B7A] flex items-center gap-3">
            <Users className="text-[#7D79F1]" size={32} />
            الطلاب
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-semibold">
            قائمة جميع الطلاب المشتركين في كورسات المدرس الخاص بكِ
          </p>
        </div>

        <div className="bg-purple-50 text-[#7D79F1] px-4 py-2 rounded-2xl border border-purple-100 font-extrabold text-xs self-start sm:self-center">
          إجمالي الطلاب: {students.length}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-5 rounded-3xl border shadow-sm">
        <label className="block text-xs font-bold text-gray-500 mb-1.5">
          بحث في الطلاب (بالاسم، رقم الهاتف، أو اسم الكورس):
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث باسم الطالب أو رقم الهاتف أو رقم ولي الأمر..."
            className="w-full pl-4 pr-11 py-3 rounded-2xl border border-gray-200 outline-none text-[#2D2B7A] focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 text-xs font-medium transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-4 top-3.5 text-gray-400" size={18} />
        </div>
      </div>

      {/* Students List */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border">
          <Loader2 className="animate-spin text-[#7D79F1] mx-auto mb-3" size={36} />
          <p className="text-gray-500 font-bold">جاري تحميل بيانات الطلاب...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl border p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold text-[#2D2B7A]">
            {searchQuery ? "لا توجد نتائج بحث مطابقة" : "لا يوجد طلاب مسجلين في كورسات المدرس حالياً"}
          </h3>
          <p className="text-gray-400 text-sm">
            {searchQuery ? "جربي البحث بكلمات أخرى أو التأكد من رقم الهاتف." : "عندما يشترك الطلاب في كورسات المدرس، سيظهرون هنا تلقائياً."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-[#F5F7FB] border-b text-[#2D2B7A] font-bold">
                <tr>
                  <th className="p-4">اسم الطالب</th>
                  <th className="p-4">رقم الطالب</th>
                  <th className="p-4">رقم ولي الأمر</th>
                  <th className="p-4">الكورسات المشترك فيها</th>
                  <th className="p-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#F3F2FF]/20 transition">
                    
                    {/* Student Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#F3F2FF] text-[#7D79F1] font-black text-xs flex items-center justify-center shrink-0">
                          {student.fullName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-extrabold text-[#2D2B7A] block text-sm">
                            {student.fullName}
                          </span>
                          {student.grade && (
                            <span className="text-[11px] text-gray-400 font-semibold block">
                              {student.grade}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Student Phone */}
                    <td className="p-4 font-mono text-xs font-bold text-gray-700 dir-ltr text-right">
                      <a
                        href={`tel:${student.phone}`}
                        className="inline-flex items-center gap-1.5 text-gray-700 hover:text-[#7D79F1] transition"
                        title="اتصال برقم الطالب"
                      >
                        <Phone size={13} className="text-[#7D79F1]" />
                        <span>{student.phone}</span>
                      </a>
                    </td>

                    {/* Parent Phone */}
                    <td className="p-4 font-mono text-xs font-bold text-gray-700 dir-ltr text-right">
                      <a
                        href={`tel:${student.parentPhone}`}
                        className="inline-flex items-center gap-1.5 text-gray-700 hover:text-emerald-600 transition"
                        title="اتصال بولي الأمر"
                      >
                        <Phone size={13} className="text-emerald-600" />
                        <span>{student.parentPhone}</span>
                      </a>
                    </td>

                    {/* Enrolled Courses */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {student.enrolledCourses.length === 0 ? (
                          <span className="text-xs text-gray-400 font-medium">لا توجد كورسات</span>
                        ) : (
                          student.enrolledCourses.map((c) => (
                            <span
                              key={c.id}
                              className="bg-[#F8F9FD] text-[#2D2B7A] border border-gray-200 px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1"
                            >
                              <BookOpen size={11} className="text-[#7D79F1]" />
                              {c.title}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="p-4 text-center">
                      <Link
                        href={`/assistant/students/${student.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold text-xs transition shadow-sm"
                      >
                        <Eye size={14} />
                        عرض الطالب
                      </Link>
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

export default function AssistantStudentsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500 font-bold">جاري تحميل صفحة الطلاب...</div>}>
      <AssistantStudentsContent />
    </Suspense>
  );
}
