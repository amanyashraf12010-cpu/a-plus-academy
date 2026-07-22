import { createClient } from "@/utils/supabase/server";
import CourseHero from "@/components/courses/CourseHero";
import CourseInfo from "@/components/courses/CourseInfo";
import CourseFeatures from "@/components/courses/CourseFeatures";
import EnrollCard from "@/components/courses/EnrollCard";
import RelatedCourses from "@/components/courses/RelatedCourses";
import Link from "next/link";

export default async function Page({ params }: any) {
  const { id } = await params;

  const supabase = await createClient();

  // 1. Fetch Course Details from Database
  const { data: dbCourse, error } = await supabase
    .from("courses")
    .select("*, teachers(name)")
    .eq("id", id)
    .single();

  if (error || !dbCourse) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#7D79F1] text-xl gap-4" dir="rtl">
        <p>الكورس المطلوب غير موجود 😕</p>
        <Link href="/#courses" className="text-sm bg-[#7D79F1] text-white px-4 py-2 rounded-xl">العودة للكورسات</Link>
      </div>
    );
  }

  // 2. Fetch Course Subscriber count
  const { data: dbStats } = await supabase
    .from("course_stats")
    .select("*")
    .eq("course_id", id)
    .maybeSingle();

  const studentCount = dbStats ? Number(dbStats.student_count) : 0;

  // 3. Map Database response to component course object
  const course = {
    id: dbCourse.id,
    title: dbCourse.title,
    teacher: dbCourse.teachers?.name || "مدرس الأكاديمية",
    description: dbCourse.description || "لا يوجد وصف حالياً لهذا الكورس.",
    image: dbCourse.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
    price: dbCourse.price,
    rating: 4.9,
    students: studentCount, // Real dynamic count
    lessons: dbCourse.video_count || 0,
    duration: dbCourse.duration || "غير محدد",
    grade: dbCourse.grade || "غير محدد"
  };

  return (
    <div className="bg-[#F8F9FD] min-h-screen" dir="rtl">

      {/* Hero */}
      <CourseHero course={course} />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-8">

        {/* Left Side */}
        <div className="lg:col-span-2 space-y-8">
          <CourseInfo course={course} />
          <CourseFeatures course={course} />
          <RelatedCourses />
        </div>

        {/* Right Side */}
        <div>
          <EnrollCard course={course} />
        </div>

      </div>
    </div>
  );
}