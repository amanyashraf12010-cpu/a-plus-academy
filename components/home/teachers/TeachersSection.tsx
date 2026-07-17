"use client";

import { useState } from "react";
import Container from "@/components/shared/Container";
import SectionTitle from "@/components/shared/SectionTitle";
import TeachersFilters from "./TeachersFilters";
import TeachersGrid from "./TeachersGrid";
import { teachers } from "@/data/teachers";

export default function TeachersSection() {
  const [grade, setGrade] = useState("");
  const [system, setSystem] = useState("");
  const [track, setTrack] = useState("");

  const filteredTeachers = teachers.filter((t) => {
    return (
      (grade ? t.grades.includes(grade) : true) &&
      (system ? t.system === system : true) &&
      (track ? t.track === track : true)
    );
  });

  const noResults = filteredTeachers.length === 0;

  return (
    <section className="py-20 bg-white">
      <Container>

        {/* Title */}
        <SectionTitle
          title="اختار مدرسك"
          subtitle="تصفح أفضل المدرسين حسب الصف والنظام والشعبة"
        />

        {/* Filters */}
        <TeachersFilters
          grade={grade}
          setGrade={setGrade}
          system={system}
          setSystem={setSystem}
          track={track}
          setTrack={setTrack}
        />

        {/* Content */}
        <div className="mt-10">

          {/* ❌ Empty State */}
          {noResults ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">

              <div className="text-6xl mb-4">😕</div>

              <h3 className="text-2xl font-bold text-[#7D79F1]">
                مفيش مدرسين 
              </h3>

              <p className="text-gray-500 mt-2">
                جرب تغيّر الفلاتر أو اعمل إعادة ضبط
              </p>

              {/* Reset Button */}
              <button
                onClick={() => {
                  setGrade("");
                  setSystem("");
                  setTrack("");
                }}
                className="mt-6 px-6 py-3 rounded-xl bg-[#7D79F1] text-white hover:opacity-90 transition"
              >
                إعادة ضبط
              </button>

            </div>
          ) : (
            /* ✅ Teachers Grid */
            <TeachersGrid teachers={filteredTeachers} />
          )}

        </div>

      </Container>
    </section>
  );
}