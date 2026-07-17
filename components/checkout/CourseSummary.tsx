import Image from "next/image";

export default function CourseSummary({ course }: any) {
  return (
    <div className="sticky top-24 bg-white rounded-3xl overflow-hidden border shadow-lg">

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">

        {/* Course Image */}
        <div className="relative h-52">

          <Image
            src={course.image}
            alt={course.title}
            fill
            sizes="400px"
            className="object-cover"
          />

          <span className="absolute top-4 right-4 bg-[#7D79F1] text-white text-sm px-4 py-1 rounded-full">
            {course.grade}
          </span>

        </div>

        {/* Content */}
        <div className="p-6">

          <h2 className="text-2xl font-bold text-[#2D2B7A]">
            {course.title}
          </h2>

          <p className="text-gray-500 mt-2">
            {course.teacher}
          </p>

          <hr className="my-5" />

          <div className="space-y-4 text-gray-600">

            <div className="flex justify-between">
              <span>📚 عدد الدروس</span>
              <span>{course.lessons}</span>
            </div>

            <div className="flex justify-between">
              <span>⏳ مدة الكورس</span>
              <span>{course.duration}</span>
            </div>

            <div className="flex justify-between">
              <span>⭐ التقييم</span>
              <span>{course.rating}</span>
            </div>

            <div className="flex justify-between">
              <span>👨‍🎓 الطلاب</span>
              <span>{course.students}</span>
            </div>

          </div>

          <hr className="my-5" />

          <div className="flex justify-between items-center">

            <span className="text-gray-500">
              السعر
            </span>

            <span className="text-4xl font-extrabold text-[#7D79F1]">
              {course.price} جنيه
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}