export default function CourseInfo({ course }: any) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border p-8">

      <h2 className="text-2xl font-bold text-[#2D2B7A] mb-5">
        عن الكورس
      </h2>

      <p className="text-gray-600 leading-8">
        {course.description}
      </p>

    </div>
  );
}