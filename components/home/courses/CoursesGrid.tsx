"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import CourseCard from "./CourseCard";

interface Props {
  activeTab: string;
}

export default function CoursesGrid({ activeTab }: Props) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCourses() {
    try {
      setLoading(true);
      const supabase = createClient();

      // 1. Fetch Course details
      const { data, error } = await supabase
        .from("courses")
        .select("*, teachers(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // 2. Fetch Course student counts from course_stats view
      const { data: statsData } = await supabase
        .from("course_stats")
        .select("*");

      const statsMap = new Map<string, number>(
        (statsData || []).map((s: any) => [s.course_id, Number(s.student_count) || 0])
      );

      const mapped = (data || []).map((course: any) => ({
        id: course.id,
        title: course.title,
        teacher: course.teachers?.name || "مدرس الأكاديمية",
        image: course.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
        rating: 4.9, // Default premium rating
        students: statsMap.get(course.id) || 0, // Real student count
        price: course.price,
        badge: course.grade,
        created_at: course.created_at
      }));

      setCourses(mapped);
    } catch (error) {
      console.error("فشل جلب الكورسات لقاعدة البيانات:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  const filteredCourses =
    activeTab === "all"
      ? courses
      : activeTab === "new"
      ? [...courses].slice(0, 3) // Show first 3 new courses
      : [...courses].sort((a, b) => b.students - a.students).slice(0, 3); // Sort by popular (most students)

  if (loading) {
    return <p className="text-center text-gray-500 py-12 font-bold">جاري تحميل الكورسات...</p>;
  }

  if (courses.length === 0) {
    return <p className="text-center text-gray-400 py-12">لا توجد كورسات مضافة حالياً في المنصة.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {filteredCourses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}