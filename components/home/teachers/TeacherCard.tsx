"use client";

import { useRouter } from "next/navigation";

export default function TeacherCard({ teacher }: any) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/teachers/${teacher.id}`)}
      className="cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center"
    >
      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-50 border-4 border-[#7D79F1]/10 relative mb-4">
        <img
          src={teacher.image}
          alt={teacher.name}
          className="w-full h-full object-cover"
        />
      </div>

      <h3 className="font-bold text-lg text-[#2D2B7A] hover:text-[#7D79F1] transition-colors">
        {teacher.name}
      </h3>

      <p className="text-xs bg-purple-50 text-[#7D79F1] px-3 py-1 rounded-full font-bold border border-purple-100 mt-2">
        {teacher.subjects.join(" - ")}
      </p>
    </div>
  );
}