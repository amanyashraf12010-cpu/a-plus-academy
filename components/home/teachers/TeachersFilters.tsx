"use client";

export default function TeachersFilters({
  grade,
  setGrade,
  system,
  setSystem,
  track,
  setTrack,
}: any) {
  return (
    <div className="flex justify-center mt-8">

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-[#7D79F1]">

        {/* 🎓 Grades */}
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="px-4 py-2 rounded-xl border border-[#7D79F1] text-[#7D79F1] outline-none"
        >
          <option value="">كل الصفوف</option>
          <option value="أولى ثانوي">أولى ثانوي</option>
          <option value="تانية ثانوي">تانية ثانوي</option>
          <option value="تالتة ثانوي">تالتة ثانوي</option>
        </select>

        {/* 🏫 System */}
        <select
          value={system}
          onChange={(e) => setSystem(e.target.value)}
          className="px-4 py-2 rounded-xl border border-[#7D79F1] text-[#7D79F1] outline-none"
        >
          <option value="">كل الأنظمة</option>
          <option value="عام">عام</option>
          <option value="أزهر">أزهر</option>
        </select>

        {/* 📚 Track */}
        <select
          value={track}
          onChange={(e) => setTrack(e.target.value)}
          className="px-4 py-2 rounded-xl border border-[#7D79F1] text-[#7D79F1] outline-none"
        >
          <option value="">كل الشعب</option>
          <option value="علمي">علمي</option>
          <option value="أدبي">أدبي</option>
        </select>

      

      </div>
    </div>
  );
}