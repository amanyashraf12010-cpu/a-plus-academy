"use client";

export default function TeachersFilters({
  grade,
  setGrade,
  system,
  setSystem,
  track,
  setTrack,
}: any) {
  
  const getTrackOptions = () => {
    if (grade === "الصف الثاني الثانوي") {
      return [
        { value: "مسار الطب وعلوم الحياة", label: "مسار الطب وعلوم الحياة" },
        { value: "مسار الهندسة وعلوم الحاسب", label: "مسار الهندسة وعلوم الحاسب" },
        { value: "مسار الأعمال", label: "مسار الأعمال" },
        { value: "مسار الآداب والفنون التطبيقية", label: "مسار الآداب والفنون التطبيقية" }
      ];
    }
    if (grade === "الصف الثالث الثانوي") {
      if (system === "azhar") {
        return [
          { value: "علمي أزهر", label: "علمي" },
          { value: "أدبي أزهر", label: "أدبي" }
        ];
      }
      // general or all systems (default to general)
      return [
        { value: "علمي علوم", label: "علمي علوم" },
        { value: "علمي رياضة", label: "علمي رياضة" },
        { value: "أدبي", label: "أدبي" }
      ];
    }
    return [];
  };

  const trackOptions = getTrackOptions();

  return (
    <div className="flex justify-center mt-8">
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-[#7D79F1]">

        {/* 🎓 Grades */}
        <select
          value={grade}
          onChange={(e) => {
            setGrade(e.target.value);
            setTrack(""); // Reset track filter on grade change
          }}
          className="px-4 py-2 rounded-xl border border-[#7D79F1] text-[#7D79F1] outline-none bg-white font-medium"
        >
          <option value="">كل الصفوف</option>
          <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
          <option value="الصف الثاني الثانوي">الصف الثاني الثانوي (بكالوريا)</option>
          <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
        </select>

        {/* 🏫 System */}
        <select
          value={system}
          onChange={(e) => {
            setSystem(e.target.value);
            setTrack(""); // Reset track filter on system change
          }}
          className="px-4 py-2 rounded-xl border border-[#7D79F1] text-[#7D79F1] outline-none bg-white font-medium"
        >
          <option value="">كل الأنظمة</option>
          <option value="general">عام</option>
          <option value="azhar">أزهر</option>
        </select>

        {/* 📚 Track */}
        {grade !== "الصف الأول الثانوي" && trackOptions.length > 0 && (
          <select
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[#7D79F1] text-[#7D79F1] outline-none bg-white font-medium"
          >
            <option value="">كل الشعب</option>
            {trackOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

      </div>
    </div>
  );
}