"use client";

import { useEffect, useState } from "react";

import CourseCard from "./CourseCard";

interface Props {
  activeTab: string;
}

export default function CoursesGrid({ activeTab }: Props) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  
  const filteredCourses =
    activeTab === "all"
      ? courses
      : courses.filter((course) => course.category === activeTab);

  if (loading) {
    return <p className="text-center text-gray-500 py-12">جاري تحميل الكورسات...</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {filteredCourses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}