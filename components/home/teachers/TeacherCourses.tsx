"use client";

import { useState } from "react";
import TeacherCourseCard from "./TeacherCourseCard";

export default function TeacherCourses({ teacher, courses }: any){
  const [selectedGrade, setSelectedGrade] = useState("");
  const grades = ["أولى ثانوي", "تانية ثانوي", "تالتة ثانوي"];

  const filteredCourses = selectedGrade
  ? courses.filter(
      (course: any) => course.grade === selectedGrade
    )
  : [];
  return (
    <div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-[#2D2B7A] mb-6">
        الكورسات المتاحة
      </h2>

      {/* Filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {grades.map((grade: string) => (
          <button
            key={grade}
            onClick={() => setSelectedGrade(grade)}
            className={`px-4 py-2 rounded-xl border transition ${
              selectedGrade === grade
                ? "bg-[#7D79F1] text-white"
                : "border-[#7D79F1] text-[#7D79F1]"
            }`}
          >
            {grade}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid md:grid-cols-3 gap-6">

  {selectedGrade === "" ? (
    <p className="text-gray-400 col-span-3 text-center">
      اختار الصف عشان تشوف الكورسات
    </p>
  ) : filteredCourses.length === 0 ? (
    <p className="text-gray-400 col-span-3 text-center">
      مفيش كورسات للصف ده
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