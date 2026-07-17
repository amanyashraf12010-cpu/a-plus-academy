
import CourseHero from "@/components/courses/CourseHero";
import CourseInfo from "@/components/courses/CourseInfo";
import CourseFeatures from "@/components/courses/CourseFeatures";
import EnrollCard from "@/components/courses/EnrollCard";
import RelatedCourses from "@/components/courses/RelatedCourses";

export default async function Page({ params }: any) {
  const { id } = await params;

  const course = {
    id,
    title: "اسم الكورس",
    teacher: "اسم المدرس",
    description: "وصف الكورس",
    image: "/111.png",
    price: 350,
    rating: 4.9,
    students: 1200,
    lessons: 30,
    duration: "20 ساعة",
  };

  return (
    <div className="bg-[#F8F9FD] min-h-screen">

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