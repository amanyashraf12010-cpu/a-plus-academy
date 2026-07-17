import Link from "next/link";
import Image from "next/image";

export default function TeacherCourseCard({ course }: any) {
    console.log("COURSE:", course);
console.log("ID:", course?.id);
  return (
    

    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border hover:shadow-xl hover:-translate-y-2 transition duration-300">

      {/* Image -> Course Details Page */}
      <Link href={`/courses/${course.id}`}>

        <div className="relative h-48">

          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover"
          />

          <span className="absolute top-4 right-4 bg-[#7D79F1] text-white text-xs px-3 py-1 rounded-full">
            {course.grade}
          </span>

        </div>

      </Link>

      {/* Content */}
      <div className="p-5">

        {/* Title -> Course Details */}
        <Link href={`/courses/${course.id}`}>
          <h3 className="text-xl font-bold text-[#2D2B7A]">
            {course.title}
          </h3>
        </Link>

        <p className="text-gray-500 mt-2 text-sm line-clamp-2">
          {course.desc}
        </p>

        <div className="flex justify-between mt-5 text-sm text-gray-500">

          <span>📚 {course.lessons} درس</span>

          <span>⏳ {course.duration}</span>

        </div>

        <div className="mt-5 flex justify-between items-center">

          <span className="text-2xl font-bold text-[#7D79F1]">
            {course.price} جنيه
          </span>

          {/* 🔥 زر الاشتراك -> Checkout */}
          <Link href={`/courses/${course.id}/checkout`}>
            <button className="bg-[#7D79F1] text-white px-5 py-2 rounded-xl hover:bg-[#6965e6] transition">
              اشترك الآن
            </button>
          </Link>

        </div>

      </div>

    </div>
  );
}