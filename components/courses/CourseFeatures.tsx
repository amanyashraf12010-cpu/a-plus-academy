export default function CourseFeatures({ course }: any) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border p-8">

      <h2 className="text-2xl font-bold text-[#2D2B7A] mb-6">
        ماذا ستتعلم؟
      </h2>

      <div className="grid md:grid-cols-2 gap-5">

        {course.features?.map((item: string, index: number) => (

          <div
            key={index}
            className="flex items-center gap-3"
          >

            <div className="w-8 h-8 rounded-full bg-[#7D79F1] text-white flex items-center justify-center flex-shrink-0">
              ✓
            </div>

            <span className="text-gray-800 font-medium">{item}</span>

          </div>

        ))}

      </div>

    </div>
  );
}