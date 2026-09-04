import Image from "next/image";
import Link from "next/link";

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    teacher: string;
    image: string;
    rating?: number;
    students: number;
    price: number;
    original_price?: number;
    badge?: string;
  };
  isSubscribed?: boolean;
}

export default function CourseCard({ course, isSubscribed = false }: CourseCardProps) {
  const targetHref = isSubscribed ? `/learn/${course.id}` : `/courses/${course.id}`;

  return (
    <Link href={targetHref} className="flex h-full">
      <div
        className="
        w-full
        flex
        flex-col
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
        <div className="relative overflow-hidden aspect-[16/9] w-full flex-shrink-0">

          <Image
            src={course.image}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Badge */}
          {Number(course.price) === 0 ? (
            <span className="absolute top-4 right-4 bg-gradient-to-r from-[#7D79F1] to-[#5B57E6] text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg font-black tracking-wide flex items-center gap-1">
              <span>🎁</span> كورس مجاني
            </span>
          ) : course.badge ? (
            <span className="absolute top-4 right-4 bg-[#7D79F1] text-white text-xs px-3 py-1 rounded-full shadow-lg">
              {course.badge}
            </span>
          ) : null}
        </div>

        {/* المحتوى */}

        <div className="p-6 flex-1 flex flex-col justify-between">

          <div>
            {/* Title */}
            <h3 className="text-xl font-bold text-[#02343F] leading-relaxed group-hover:text-[#7D79F1] transition min-h-[3.75rem] line-clamp-2">
              {course.title}
            </h3>

            {/* Teacher */}
            <p className="mt-2 text-gray-500">
              {course.teacher}
            </p>
          </div>

          <div>
            <hr className="my-6" />

            {/* Price */}
            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-400 text-sm">
                  السعر
                </p>

                {Number(course.price) === 0 ? (
                  <h4 className="text-2xl font-black text-[#7D79F1]">
                    مجاني 🎉
                  </h4>
                ) : (
                  <div className="flex flex-col">
                    {course.original_price && Number(course.original_price) > Number(course.price) && (
                      <span className="text-xs line-through text-gray-400 font-normal mb-0.5">
                        {course.original_price} جنيه
                      </span>
                    )}
                    <h4 className="text-3xl font-bold text-[#7D79F1] flex items-baseline">
                      <span>{course.price}</span>
                      <span className="text-xs mr-1 font-normal text-gray-500">
                        جنيه
                      </span>
                    </h4>
                  </div>
                )}

              </div>

              {isSubscribed ? (
                Number(course.price) === 0 ? (
                  <button
                    className="
                    px-5
                    py-3
                    rounded-xl
                    bg-[#7D79F1]
                    text-white
                    font-bold
                    transition
                    duration-300
                    hover:bg-[#655EF0]
                    shadow-md
                    hover:shadow-lg
                  "
                  >
                    استكمل التعلم 📚
                  </button>
                ) : (
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
                    استكمل التعلم 📚
                  </button>
                )
              ) : Number(course.price) === 0 ? (
                <button
                  className="
                  px-5
                  py-3
                  rounded-xl
                  bg-[#7D79F1]
                  text-white
                  font-bold
                  transition
                  duration-300
                  hover:bg-[#655EF0]
                  shadow-md
                  hover:shadow-lg
                "
                >
                  ابدأ التعلم 🚀
                </button>
              ) : (
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
              )}

            </div>
          </div>

        </div>

      </div>
    </Link>
  );
}