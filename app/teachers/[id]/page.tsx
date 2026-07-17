import { teachers } from "@/data/teachers";
import { courses } from "@/data/courses";

import Image from "next/image";
import TeacherCourses from "@/components/home/teachers/TeacherCourses";

export default async function Page({ params }: any) {
  const { id } = await params;

  const teacher = teachers.find(
    (t) => String(t.id) === String(id)
  );

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#7D79F1] text-xl">
        المدرس غير موجود 😕
      </div>
    );
  }

  // كورسات المدرس
  const teacherCourses = courses.filter(
    (course) => course.teacherId === teacher.id
  );

  return (
    <div className="min-h-screen bg-white">

      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-[#7D79F1] to-[#5b57e6] text-white px-6 md:px-20 py-16">

        <div className="flex flex-col md:flex-row items-center gap-8">

          {/* Image */}
          <div className="w-40 h-40 relative">
            <Image
              src={teacher.image}
              alt={teacher.name}
              fill
              className="rounded-2xl object-cover border-4 border-white"
            />
          </div>

          {/* Info */}
          <div className="text-center md:text-right">

            <h1 className="text-3xl font-bold">
              {teacher.name}
            </h1>

            <p className="text-white/80 mt-2">
              {teacher.subjects.join(" - ")}
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

        <TeacherCourses
          teacher={teacher}
          courses={teacherCourses}
        />

      </div>

    </div>
  );
}