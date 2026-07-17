import Image from "next/image";
import Link from "next/link";
import { Star, Users } from "lucide-react";

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    teacher: string;
    image: string;
    rating: number;
    students: number;
    price: number;
    badge?: string;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <div
        className="
        group
        overflow-hidden
        rounded-3xl
        bg-white
        border border-gray-200
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-3
        hover:shadow-2xl
        hover:border-[#7D79F1]
      "
      >
        {/* الصورة */}
        <div className="relative overflow-hidden h-60">

          <Image
            src={course.image}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Badge */}
          {course.badge && (
            <span className="absolute top-4 right-4 bg-[#7D79F1] text-white text-xs px-3 py-1 rounded-full shadow-lg">
              {course.badge}
            </span>
          )}
        </div>

        {/* المحتوى */}

        <div className="p-6">

          {/* Rating */}

          <div className="flex items-center justify-between mb-5">

            <div className="flex items-center gap-2 text-[#F59E0B]">

              <Star size={18} fill="currentColor" />

              <span className="font-semibold text-gray-700">
                {course.rating}
              </span>

            </div>

            <div className="flex items-center gap-2 text-gray-500">

              <Users size={18} />

              <span>{course.students}</span>

            </div>

          </div>

          {/* Title */}

          <h3 className="text-xl font-bold text-[#02343F] leading-relaxed group-hover:text-[#7D79F1] transition">
            {course.title}
          </h3>

          {/* Teacher */}

          <p className="mt-2 text-gray-500">
            {course.teacher}
          </p>

          <hr className="my-6" />

          {/* Price */}

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-400 text-sm">
                السعر
              </p>

              <h4 className="text-3xl font-bold text-[#7D79F1]">
                {course.price}
                <span className="text-base mr-1">
                  جنيه
                </span>
              </h4>

            </div>

            <button
              className="
              px-5
              py-3
              rounded-xl
              bg-[#7D79F1]
              text-white
              font-semibold
              transition
              duration-300
              hover:bg-[#655EF0]
            "
            >
              اشترك الآن
            </button>

          </div>

        </div>

      </div>
    </Link>
  );
}