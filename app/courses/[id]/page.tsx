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

  // Parse what_will_learn lines
  const features = dbCourse.what_will_learn
    ? dbCourse.what_will_learn.split("\n").map((line: string) => line.trim()).filter(Boolean)
    : [];

  // 3. Map Database response to component course object
  const course = {
    id: dbCourse.id,
    title: dbCourse.title,
    teacher: dbCourse.teachers?.name || "مدرس الأكاديمية",
    description: dbCourse.description || "لا يوجد وصف حالياً لهذا الكورس.",
    image: dbCourse.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
    price: dbCourse.price,
    original_price: dbCourse.original_price,
    rating: 4.9,
    students: studentCount, // Real dynamic count
    lessons: dbCourse.video_count || 0,
    duration: dbCourse.duration || "غير محدد",
    grade: dbCourse.grade || "غير محدد",
    features
  };

  // 4. Fetch Related Courses
  let relatedCourses: any[] = [];
  if (dbCourse.related_courses) {
    const ids = dbCourse.related_courses.split(",").map((i: string) => i.trim()).filter(Boolean);
    if (ids.length > 0) {
      const { data: relData } = await supabase
        .from("courses")
        .select("*, teachers(name)")
        .in("id", ids);
      relatedCourses = relData || [];
    }
  }

  if (relatedCourses.length === 0) {
    // Fallback: Fetch other courses in the academy
    const { data: relData } = await supabase
      .from("courses")
      .select("*, teachers(name)")
      .neq("id", id)
      .limit(3);
    relatedCourses = relData || [];
  }

  // Fetch dynamic student counts for the related courses
  const relIds = relatedCourses.map((c: any) => c.id);
  const statsMap = new Map<string, number>();
  if (relIds.length > 0) {
    const { data: relStats } = await supabase
      .from("course_stats")
      .select("*")
      .in("course_id", relIds);
    (relStats || []).forEach((s: any) => {
      statsMap.set(s.course_id, Number(s.student_count) || 0);
    });
  }

  const mappedRelatedCourses = relatedCourses.map((c: any) => ({
    id: c.id,
    title: c.title,
    teacher: c.teachers?.name || "مدرس الأكاديمية",
    image: c.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
    price: c.price,
    original_price: c.original_price,
    rating: 4.9,
    students: statsMap.get(c.id) || 0,
    lessons: c.video_count || 0,
    duration: c.duration || "غير محدد",
    grade: c.grade || "غير محدد"
  }));

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
          <RelatedCourses courses={mappedRelatedCourses} />
        </div>

        {/* Right Side */}
        <div>
          <EnrollCard course={course} />
        </div>

      </div>
    </div>
  );
}