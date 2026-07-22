"use client";

import { useEffect, useState } from "react";
import Container from "@/components/shared/Container";
import SectionTitle from "@/components/shared/SectionTitle";
import TeachersFilters from "./TeachersFilters";
import TeachersGrid from "./TeachersGrid";
import { createClient } from "@/utils/supabase/client";

export default function TeachersSection() {
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState("");
  const [system, setSystem] = useState("");
  const [track, setTrack] = useState("");

  async function loadTeachers() {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((teacher: any) => ({
        id: teacher.id,
        name: teacher.name,
        image: teacher.image || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(teacher.name)}`,
        subjects: [teacher.subject || "مادة"],
        grades: [teacher.grade || ""],
        system: teacher.education_system,
        track: teacher.track
      }));

      setTeachersList(mapped);
    } catch (error) {
      console.error("فشل جلب قائمة المدرسين في الهوم:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  const filteredTeachers = teachersList.filter((t) => {
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

          {loading ? (
            <p className="text-center text-gray-500 py-12 font-bold">جاري تحميل قائمة المدرسين...</p>
          ) : noResults ? (
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
                className="mt-6 px-6 py-3 rounded-xl bg-[#7D79F1] text-white hover:opacity-90 transition cursor-pointer"
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