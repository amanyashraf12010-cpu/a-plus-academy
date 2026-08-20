"use client";

import { useState } from "react";
import TeacherCourseCard from "./TeacherCourseCard";

export default function TeacherCourses({ teacher, courses }: any) {
  const [selectedGrade, setSelectedGrade] = useState("");

  const grades = [
    { id: "الصف الأول الثانوي", label: "أولى ثانوي" },
    { id: "الصف الثاني الثانوي", label: "تانية ثانوي" },
    { id: "الصف الثالث الثانوي", label: "تالتة ثانوي" },
  ];

  const filteredCourses = selectedGrade
    ? courses.filter((course: any) => course.grade === selectedGrade)
    : [];

  return (
    <div>
      {/* Filter */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {grades.map((grade) => (
          <button
            key={grade.id}
            onClick={() => setSelectedGrade(grade.id)}
            className={`px-5 py-2.5 rounded-xl border font-semibold transition cursor-pointer text-sm ${
              selectedGrade === grade.id
                ? "bg-[#7D79F1] text-white border-[#7D79F1] shadow-md shadow-[#7D79F1]/20"
                : "border-[#7D79F1] text-[#7D79F1] hover:bg-[#F3F2FF]/50"
            }`}
          >
            {grade.label}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {selectedGrade === "" ? (
          <p className="text-gray-400 col-span-3 text-center py-6">
            الرجاء اختيار الصف الدراسي لعرض الكورسات المتاحة.
          </p>
        ) : filteredCourses.length === 0 ? (
          <p className="text-gray-400 col-span-3 text-center py-6">
            لا توجد كورسات مضافة لهذا الصف حالياً.
          </p>
        ) : (
          filteredCourses.map((course: any) => (
            <TeacherCourseCard key={course.id} course={course} />
          ))
        )}
      </div>
    </div>
  );
}