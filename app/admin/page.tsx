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
        <h1 className="text-3xl font-extrabold text-[#2D2B7A]">
          📊 لوحة التحكم الرئيسية
        </h1>
        <p className="text-gray-500 mt-2">
          إحصائيات ونظرة عامة على منصة A+ Academy التعليمية
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-gray-500 font-semibold text-sm">إجمالي الطلاب</h2>
          <p className="text-4xl font-extrabold text-[#7D79F1] mt-2">
            {students.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-gray-500 font-semibold text-sm">طلبات التفعيل المعلقة</h2>
          <p className="text-4xl font-extrabold text-amber-500 mt-2">
            {pendingStudents.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-gray-500 font-semibold text-sm">الحسابات المفعلة</h2>
          <p className="text-4xl font-extrabold text-green-600 mt-2">
            {students.length - pendingStudents.length}
          </p>
        </div>

      </div>

      {/* Pending Students */}
      <div className="bg-white rounded-2xl border mt-10 p-6 shadow-sm">

        <h2 className="text-xl font-bold mb-6">
          الطلاب في انتظار الموافقة
        </h2>

        {loading ? (
          <p>جاري التحميل...</p>
        ) : pendingStudents.length === 0 ? (
          <p>لا يوجد طلبات جديدة.</p>
        ) : (
          <div className="space-y-4">

            {pendingStudents.map((student) => (

              <div
                key={student.id}
                className="flex items-center justify-between border rounded-xl p-4"
              >

                <div>
                  <p className="font-bold">
                    {student.full_name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {student.grade} - {student.education_system}
                  </p>
                </div>

                <button
                  onClick={() => handleApprove(student.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  قبول
                </button>

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  );
}