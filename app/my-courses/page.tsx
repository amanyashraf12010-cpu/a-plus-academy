"use client";

import { useEffect, useState } from "react";

import MyCourseCard from "@/components/my-courses/MyCourseCard";
import EmptyCourses from "@/components/my-courses/EmptyCourses";

export default function MyCoursesPage() {
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function getMyCourses() {
  return [
    {
      id: 1,
      title: "الفيزياء",
      teacher: "أ/ أحمد محمد",
      progress: 40,
      image: "/teacher1.jpg",
    },
    {
      id: 2,
      title: "الكيمياء",
      teacher: "أ/ محمد علي",
      progress: 75,
      image: "/teacher2.jpg",
    },
  ];
}
  return (
    <div className="min-h-screen bg-[#F8F9FD]">

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#7D79F1] to-[#5E5AEF] text-white">

        <div className="max-w-7xl mx-auto px-6 py-16">

          <h1 className="text-5xl font-bold">
            كورساتي
          </h1>

          <p className="mt-4 text-lg text-white/90">
            تابع رحلتك التعليمية واستكمل من حيث توقفت.
          </p>

          <div className="mt-6 inline-flex bg-white/20 px-5 py-3 rounded-2xl">
            لديك {myCourses.length} كورسات
          </div>

        </div>

      </div>

      {/* Courses */}
      <div className="max-w-7xl mx-auto px-6 py-12">

        {loading ? (
          <p className="text-center text-gray-500">جاري التحميل...</p>
        ) : myCourses.length === 0 ? (
          <EmptyCourses />
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {myCourses.map((course) => (
              <MyCourseCard
                key={course.id}
                course={course}
              />
            ))}
          </div>
        )}

      </div>

    </div>
  );
}