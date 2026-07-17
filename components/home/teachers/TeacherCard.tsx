"use client";

import { useRouter } from "next/navigation";

export default function TeacherCard({ teacher }: any) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/teachers/${teacher.id}`)}
      className="cursor-pointer bg-white rounded-2xl p-4 shadow hover:-translate-y-2 transition"
    >

      <img
        src={teacher.image}
        className="w-full h-40 object-cover rounded-xl"
      />

      <h3 className="mt-3 font-bold text-[#2D2B7A]">
        {teacher.name}
      </h3>

      <p className="text-gray-500 text-sm">
        {teacher.subjects.join(" - ")}
      </p>

    </div>
  );
}