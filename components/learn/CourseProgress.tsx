export default function CourseProgress({
  progress,
}: {
  progress: number;
}) {
  return (
    <div className="bg-white rounded-3xl border shadow-sm p-6">

      <div className="flex justify-between items-center mb-4">

        <div>

          <h2 className="text-xl font-bold text-[#2D2B7A]">
            تقدمك في الكورس
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            استمر حتى تكمل الكورس بالكامل 🚀
          </p>

        </div>

        <span className="text-3xl font-bold text-[#7D79F1]">
          {progress}%
        </span>

      </div>

      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

        <div
          className="bg-[#7D79F1] h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

    </div>
  );
}