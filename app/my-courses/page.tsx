"use client";

import { useEffect, useState } from "react";
import { getMyCourses } from "@/lib/student";
import MyCourseCard from "@/components/my-courses/MyCourseCard";
import EmptyCourses from "@/components/my-courses/EmptyCourses";

export default function MyCoursesPage() {
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCourses() {
    try {
      setLoading(true);
      const data = await getMyCourses();
      
      // Map database schema response to what MyCourseCard expects:
      // MyCourseCard expects: { id, title, teacher, image, progress (optional) }
      const mappedData = data.map((course: any) => ({
        id: course.id,
        title: course.title,
        teacher: course.teachers?.name || "مدرس الأكاديمية",
        image: course.image || "/teacher1.jpg",
        progress: 0 // Progress tracking can be added later if needed
      }));

      setMyCourses(mappedData);
    } catch (error) {
      console.error("فشل تحميل الكورسات المشترك بها:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FD]" dir="rtl">

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#7D79F1] to-[#5E5AEF] text-white">

        <div className="max-w-7xl mx-auto px-6 py-16">

          <h1 className="text-5xl font-bold">
            كورساتي
          </h1>

          <p className="mt-4 text-lg text-white/90">
            تابع رحلتك التعليمية واستكمل من حيث توقفت.
          </p>

          <div className="mt-6 inline-flex bg-white/20 px-5 py-3 rounded-2xl font-bold">
            لديك {myCourses.length} كورسات
          </div>

        </div>

      </div>

      {/* Courses */}
      <div className="max-w-7xl mx-auto px-6 py-12">

        {loading ? (
          <p className="text-center text-gray-500 font-bold">جاري تحميل كورساتك المشترك بها...</p>
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