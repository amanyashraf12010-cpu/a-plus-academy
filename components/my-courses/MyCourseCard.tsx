import Image from "next/image";
import Link from "next/link";
import { PlayCircle } from "lucide-react";

export default function MyCourseCard({ course }: any) {
  return (
    <div className="bg-white rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">

      {/* Image */}
      <div className="relative h-56">

        <Image
          src={course.image}
          alt={course.title}
          fill
          sizes="100vw"
          className="object-cover"
        />

      </div>

      {/* Content */}
      <div className="p-6">

        <h2 className="text-2xl font-bold text-[#2D2B7A]">
          {course.title}
        </h2>

        <p className="text-gray-500 mt-2">
          {course.teacher}
        </p>

        <div className="flex justify-between mt-6 text-gray-500 text-sm">

          <span>
            عدد الدروس
          </span>

          <span className="font-medium text-black">
            {course.lessons}
          </span>

        </div>

        <div className="flex justify-between mt-3 text-gray-500 text-sm">

          <span>
            مدة الكورس
          </span>

          <span className="font-medium text-black">
            {course.duration}
          </span>

        </div>

        <Link
          href={`/learn/${course.id}`}
          className="mt-8 flex items-center justify-center gap-3 w-full bg-[#7D79F1] hover:bg-[#6965e6] text-white py-4 rounded-2xl font-semibold transition"
        >
          <PlayCircle size={22} />

          استكمال التعلم

        </Link>

      </div>

    </div>
  );
}