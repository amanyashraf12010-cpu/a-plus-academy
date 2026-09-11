import { createClient } from "@/utils/supabase/server";
import CourseHero from "@/components/courses/CourseHero";
import CourseInfo from "@/components/courses/CourseInfo";
import CourseFeatures from "@/components/courses/CourseFeatures";
import CourseLessonsList from "@/components/courses/CourseLessonsList";
import EnrollCard from "@/components/courses/EnrollCard";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  // 3. Fetch Course Lessons
  const { data: dbLessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", id)
    .order("order", { ascending: true });

  const now = new Date();
  const visibleLessons = (dbLessons || []).filter(
    (l: any) => !l.publish_at || new Date(l.publish_at) <= now
  );

  // 4. Fetch quizzes to check which lessons have attached quizzes
  const { data: dbQuizzes } = await supabase
    .from("quizzes")
    .select("id, lesson_id")
    .eq("course_id", id)
    .eq("is_active", true);

  const quizLessonIds = new Set((dbQuizzes || []).map((q: any) => q.lesson_id).filter(Boolean));

  const lessons = visibleLessons.map((l: any) => ({
    ...l,
    hasQuiz: quizLessonIds.has(l.id)
  }));

  // Parse what_will_learn lines
  const features = dbCourse.what_will_learn
    ? dbCourse.what_will_learn.split("\n").map((line: string) => line.trim()).filter(Boolean)
    : [];

  // 5. Map Database response to component course object
  const course = {
    id: dbCourse.id,
    title: dbCourse.title,
    teacher: dbCourse.teachers?.name || "مدرس الأكاديمية",
    description: dbCourse.description || "لا يوجد وصف حالياً لهذا الكورس.",
    image: dbCourse.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
    price: dbCourse.price,
    original_price: dbCourse.original_price,
    subscription_type: dbCourse.subscription_type || "full",
    students: studentCount, // Real dynamic count
    lessons: dbCourse.video_count || lessons.length || 0,
    duration: dbCourse.duration || "غير محدد",
    grade: dbCourse.grade || "غير محدد",
    features
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
          <CourseLessonsList course={course} lessons={lessons} />
          <CourseFeatures course={course} />
        </div>

        {/* Right Side */}
        <div>
          <EnrollCard course={course} />
        </div>

      </div>
    </div>
  );
}