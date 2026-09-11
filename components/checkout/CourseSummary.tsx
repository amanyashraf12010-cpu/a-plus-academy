export default function CourseSummary({ course, lesson }: { course: any; lesson?: any }) {
  const isLessonCheckout = Boolean(lesson);
  const displayPrice = isLessonCheckout ? (lesson.price || 0) : course.price;

  return (
    <div className="sticky top-24 bg-white rounded-3xl overflow-hidden border shadow-lg">

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">

        {/* Course Image */}
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">

          <img
            src={course.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600"}
            alt={course.title}
            className="w-full h-full object-cover"
          />

          <span className="absolute top-4 right-4 bg-[#7D79F1] text-white text-xs px-3.5 py-1 rounded-full font-bold">
            {course.grade || "كورس تعليمي"}
          </span>

          {isLessonCheckout && (
            <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md flex items-center gap-1">
              📖 اشتراك حصة
            </span>
          )}

        </div>

        {/* Content */}
        <div className="p-6">

          {isLessonCheckout ? (
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#7D79F1]">الحصة المختارة:</span>
              <h2 className="text-xl font-black text-[#2D2B7A]">
                {lesson.title}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                من كورس: <span className="font-bold text-gray-700">{course.title}</span>
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-[#2D2B7A]">
                {course.title}
              </h2>
              <p className="text-gray-500 mt-1 text-xs">
                {course.teacher}
              </p>
            </div>
          )}

          <hr className="my-5 border-gray-100" />

          <div className="space-y-3 text-gray-600 text-xs font-semibold">

            <div className="flex justify-between items-center">
              <span className="text-gray-400">👨‍🏫 المدرس المسؤول</span>
              <span className="text-gray-800">{course.teacher}</span>
            </div>

            {isLessonCheckout ? (
              <>
                {lesson.duration && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">⏳ مدة الحصة</span>
                    <span className="text-gray-800">{lesson.duration}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">🎯 نوع الاشتراك</span>
                  <span className="text-emerald-700 font-bold">حصة منفصلة فقط</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">📚 عدد الدروس</span>
                  <span className="text-gray-800">{course.lessons || 0} درس</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">⏳ مدة الكورس</span>
                  <span className="text-gray-800">{course.duration}</span>
                </div>
              </>
            )}

          </div>

          <hr className="my-5 border-gray-100" />

          <div className="flex justify-between items-center">

            <span className="text-gray-500 text-sm font-bold">
              {isLessonCheckout ? "سعر الحصة" : "سعر الكورس بالكامل"}
            </span>

            <span className="text-3xl font-black text-[#7D79F1]">
              {displayPrice} <span className="text-sm font-normal text-gray-500">جنيه</span>
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}