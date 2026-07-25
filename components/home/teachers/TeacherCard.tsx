"use client";

import { useRouter } from "next/navigation";

export default function TeacherCard({ teacher }: any) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/teachers/${teacher.id}`)}
      className="group cursor-pointer bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
    >
      {/* Portrait Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-50">
        <img
          src={teacher.image}
          alt={teacher.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Soft bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Info Content */}
      <div className="p-5 flex flex-col items-start text-right">
        <h3 className="font-bold text-lg text-[#2D2B7A] group-hover:text-[#7D79F1] transition-colors duration-300">
          {teacher.name}
        </h3>

        <p className="text-xs bg-purple-50 text-[#7D79F1] px-3 py-1 rounded-full font-bold border border-purple-100 mt-2">
          {teacher.subjects.join(" - ")}
        </p>
      </div>
    </div>
  );
}