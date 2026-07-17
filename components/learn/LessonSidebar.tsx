"use client";

import { useState } from "react";
import LessonItem from "./LessonItem";

export default function LessonSidebar({
  course,
}: any) {
  const [currentLesson, setCurrentLesson] = useState(
    course.currentLesson
  );

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-5 sticky top-24">

      <div className="mb-6">

        <h2 className="text-xl font-bold text-[#2D2B7A]">
          محتوى الكورس
        </h2>

        <p className="text-gray-500 mt-2">
          {course.lessons.length} دروس
        </p>

      </div>

      <div className="space-y-3">

        {course.lessons.map((lesson: any) => (
          <div
            key={lesson.id}
            onClick={() => setCurrentLesson(lesson.id)}
          >
            <LessonItem
              lesson={lesson}
              active={lesson.id === currentLesson}
            />
          </div>
        ))}

      </div>

    </div>
  );
}