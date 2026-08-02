"use client";

import { useEffect, useState } from "react";
import { getStudents, approveStudent } from "@/lib/admin";

export default function AdminDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadStudents() {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function handleApprove(id: string) {
    await approveStudent(id);
    loadStudents();
  }

  const pendingStudents = students.filter(
    (student) => !student.is_approved
  );

  return (
    <div className="space-y-8" dir="rtl">

      <div>
        <h1 className="text-3xl font-black text-[#2D2B7A]">
          📊 لوحة التحكم الرئيسية
        </h1>
        <p className="text-slate-700 font-bold mt-2">
          إحصائيات ونظرة عامة على منصة +A التعليمية
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-slate-700 font-extrabold text-sm">إجمالي الطلاب</h2>
          <p className="text-4xl font-black text-[#7D79F1] mt-2">
            {students.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-slate-700 font-extrabold text-sm">طلبات التفعيل المعلقة</h2>
          <p className="text-4xl font-black text-amber-600 mt-2">
            {pendingStudents.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-slate-700 font-extrabold text-sm">الحسابات المفعلة</h2>
          <p className="text-4xl font-black text-green-600 mt-2">
            {students.length - pendingStudents.length}
          </p>
        </div>

      </div>

      {/* Pending Students */}
      <div className="bg-white rounded-2xl border mt-10 p-6 shadow-sm">

        <h2 className="text-xl font-black text-[#2D2B7A] mb-6">
          الطلاب في انتظار الموافقة
        </h2>

        {loading ? (
          <p className="text-slate-600 font-bold">جاري التحميل...</p>
        ) : pendingStudents.length === 0 ? (
          <p className="text-slate-600 font-bold text-center py-6">لا يوجد طلبات تفعيل معلقة حالياً.</p>
        ) : (
          <div className="space-y-4">

            {pendingStudents.map((student) => (

              <div
                key={student.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 border rounded-2xl p-5 hover:shadow-md transition bg-white"
              >

                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-black text-lg text-[#2D2B7A]">
                      {student.full_name}
                    </p>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-[#F3F2FF] text-[#7D79F1] border border-purple-200">
                      {student.grade} ({student.education_system === "general" ? "ثانوي عام" : "ثانوي أزهر"})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-6 text-sm text-[#02343F] font-bold bg-[#F8FAFC] p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-500 font-extrabold ml-1">📱 هاتف الطالب:</span>
                      <span className="text-slate-900 font-black select-all">{student.phone || "غير مسجل"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-extrabold ml-1">👨‍👩‍👦 هاتف ولي الأمر:</span>
                      <span className="text-slate-900 font-black select-all">{student.parent_phone || "غير مسجل"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-extrabold ml-1">📍 المحافظة:</span>
                      <span className="text-slate-900 font-black">{student.governorate || "غير مسجل"}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleApprove(student.id)}
                  className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition duration-200 cursor-pointer self-start md:self-auto"
                >
                  قبول وتفعيل
                </button>

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  );
}