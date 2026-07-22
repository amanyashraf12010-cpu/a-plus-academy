import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import TeacherCourses from "@/components/home/teachers/TeacherCourses";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function Page({ params }: any) {
  const { id } = await params;

  const supabase = await createClient();

  // 1. Fetch Teacher Details
  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .select("*")
    .eq("id", id)
    .single();

  if (teacherError || !teacher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#7D79F1] text-xl gap-4" dir="rtl">
        <p>المدرس غير موجود 😕</p>
        <Link href="/#teachers" className="text-sm bg-[#7D79F1] text-white px-4 py-2 rounded-xl">العودة للرئيسية</Link>
      </div>
    );
  }

  // 2. Fetch Teacher's Courses and Stats
  const { data: dbCourses } = await supabase
    .from("courses")
    .select("*, teachers(name)")
    .eq("teacher_id", teacher.id);

  const { data: statsData } = await supabase
    .from("course_stats")
    .select("*");

  const statsMap = new Map<string, number>(
    (statsData || []).map((s: any) => [s.course_id, Number(s.student_count) || 0])
  );

  const mappedTeacher = {
    id: teacher.id,
    name: teacher.name,
    image: teacher.image || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(teacher.name)}`,
    subjects: [teacher.subject || "مادة"]
  };

  const mappedCourses = (dbCourses || []).map((course: any) => ({
    id: course.id,
    title: course.title,
    teacher: course.teachers?.name || teacher.name,
    image: course.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
    price: course.price,
    badge: course.grade,
    grade: course.grade, // Pass grade field for filters
    rating: 4.9,
    students: statsMap.get(course.id) || 0 // Real subscriber count
  }));

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-[#7D79F1] to-[#5b57e6] text-white px-6 md:px-20 py-16">
        
        <Link href="/#teachers" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm">
          <ArrowRight size={16} />
          العودة للمدرسين
        </Link>

        <div className="flex flex-col md:flex-row items-center gap-8">

          {/* Image */}
          <div className="w-40 h-40 relative">
            <Image
              src={mappedTeacher.image}
              alt={mappedTeacher.name}
              fill
              className="rounded-2xl object-cover border-4 border-white"
            />
          </div>

          {/* Info */}
          <div className="text-center md:text-right">

            <h1 className="text-3xl font-bold">
              {mappedTeacher.name}
            </h1>

            <p className="text-white/80 mt-2">
              {mappedTeacher.subjects.join(" - ")}
            </p>

            <div className="flex gap-3 mt-4 flex-wrap justify-center md:justify-start">

              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                👨‍🎓 مدرس معتمد
              </span>

              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                ⭐ 4.9
              </span>

              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                📚 كورسات متنوعة
              </span>

            </div>

          </div>

        </div>
      </div>

      {/* COURSES SECTION */}
      <div className="px-6 md:px-20 py-12">

        <h2 className="text-2xl font-bold text-[#2D2B7A] mb-6">
          الكورسات المتاحة
        </h2>

        {mappedCourses.length === 0 ? (
          <p className="text-gray-400">لا توجد كورسات مضافة لهذا المدرس حالياً.</p>
        ) : (
          <TeacherCourses
            teacher={mappedTeacher}
            courses={mappedCourses}
          />
        )}

      </div>

    </div>
  );
}