"use client";

import { useRouter } from "next/navigation";

export default function TeacherCard({ teacher }: any) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/teachers/${teacher.id}`)}
      className="group cursor-pointer bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center"
    >
      {/* 1:1 Aspect Square Image spanning full inner card width */}
      <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative mb-4">
        <img
          src={teacher.image}
          alt={teacher.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <h3 className="font-extrabold text-lg text-[#2D2B7A] group-hover:text-[#7D79F1] transition-colors duration-300">
        {teacher.name}
      </h3>

      <p className="text-xs bg-purple-50 text-[#7D79F1] px-3 py-1 rounded-full font-bold border border-purple-100 mt-2">
        {teacher.subjects.join(" - ")}
      </p>

      {/* Teacher description */}
      {teacher.description && (
        <p className="text-gray-500 text-xs mt-3 line-clamp-2 leading-relaxed max-w-xs">
          {teacher.description}
        </p>
      )}
    </div>
  );
}