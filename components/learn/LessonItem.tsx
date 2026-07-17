import { CheckCircle, PlayCircle } from "lucide-react";

export default function LessonItem({
  lesson,
  active,
}: any) {
  return (
    <div
      className={`p-4 rounded-2xl border transition cursor-pointer ${
        active
          ? "border-[#7D79F1] bg-[#F3F2FF]"
          : "border-gray-200 hover:border-[#7D79F1]"
      }`}
    >
      <div className="flex justify-between items-center">

        <div>

          <h3 className="font-semibold text-[#2D2B7A]">
            {lesson.title}
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            {lesson.duration}
          </p>

        </div>

        {lesson.completed ? (
          <CheckCircle
            size={22}
            className="text-green-500"
          />
        ) : (
          <PlayCircle
            size={22}
            className="text-[#7D79F1]"
          />
        )}

      </div>
    </div>
  );
}