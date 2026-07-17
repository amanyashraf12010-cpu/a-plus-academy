import Image from "next/image";

export default function CourseHero({ course }: any) {
  return (
    <div className="bg-gradient-to-r from-[#7D79F1] to-[#5B57E6] rounded-3xl p-8 text-white">

      <div className="grid md:grid-cols-2 gap-10 items-center">

        {/* Left */}
        <div>

          <span className="bg-white/20 px-4 py-2 rounded-full text-sm">
            {course.grade}
          </span>

          <h1 className="text-4xl font-bold mt-5">
            {course.title}
          </h1>

          <p className="mt-4 text-white/90">
            {course.description}
          </p>

          <div className="flex gap-4 mt-6 flex-wrap">

            <div className="bg-white/20 px-4 py-2 rounded-xl">
              👨‍🏫 {course.teacher}
            </div>

            <div className="bg-white/20 px-4 py-2 rounded-xl">
              ⭐ 4.9
            </div>

            <div className="bg-white/20 px-4 py-2 rounded-xl">
              📚 {course.lessons} درس
            </div>

          </div>

        </div>

        {/* Right */}

        <div className="relative h-[320px] rounded-3xl overflow-hidden shadow-2xl">

          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover"
          />

        </div>

      </div>

    </div>
  );
}