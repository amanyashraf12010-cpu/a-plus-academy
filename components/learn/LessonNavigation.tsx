export default function LessonNavigation() {
  return (
    <div className="bg-white rounded-3xl border shadow-sm mt-8 p-6">

      <div className="flex justify-between gap-4">

        <button className="flex-1 border border-[#7D79F1] text-[#7D79F1] rounded-2xl py-4 font-semibold hover:bg-[#F3F2FF] transition">
          ← الدرس السابق
        </button>

        <button className="flex-1 bg-[#7D79F1] text-white rounded-2xl py-4 font-semibold hover:bg-[#6965E6] transition">
          الدرس التالي →
        </button>

      </div>

    </div>
  );
}