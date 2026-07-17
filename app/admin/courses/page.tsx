"use client";

import { useState } from "react";
import Link from "next/link";
import { courses as initialCourses } from "@/data/courses";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState(initialCourses);

  // 🗑 Delete
  const handleDelete = (id: number) => {
    const filtered = courses.filter((c) => c.id !== id);
    setCourses(filtered);
  };

  return (
    <div>

      <h1 className="text-3xl font-bold text-[#2D2B7A]">
        📚 إدارة الكورسات
      </h1>

      <p className="text-gray-500 mt-2">
        تعديل - حذف - إدارة الكورسات
      </p>

      {/* Add Button */}
      <Link
        href="/admin/courses/new"
        className="inline-block mt-6 bg-[#7D79F1] text-white px-6 py-3 rounded-xl hover:bg-[#6965e6] transition"
      >
        ➕ إضافة كورس جديد
      </Link>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">

        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white border rounded-2xl p-5 shadow-sm"
          >

            <h2 className="text-xl font-bold text-[#2D2B7A]">
              {course.title}
            </h2>

            <p className="text-gray-500 mt-2">
              👨‍🏫 {course.teacherId}
            </p>

            <div className="mt-4 text-sm text-gray-500">
              السعر: {course.price} جنيه
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">

              {/* Edit (مؤقت) */}
              <button
                onClick={() => alert("هنعمل Edit Page بعدين 😎")}
                className="flex-1 bg-[#7D79F1] text-white py-2 rounded-xl hover:bg-[#6965e6] transition"
              >
                تعديل
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(course.id)}
                className="flex-1 bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 transition"
              >
                حذف
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}