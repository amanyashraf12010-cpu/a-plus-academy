import Link from "next/link";

export default function EmptyCourses() {
  return (
    <div className="bg-white rounded-3xl shadow-sm border p-16 text-center">

      <div className="text-7xl">
        📚
      </div>

      <h2 className="text-3xl font-bold text-[#2D2B7A] mt-6">
        لا يوجد لديك كورسات
      </h2>

      <p className="text-gray-500 mt-3">
        اشترك في أول كورس وابدأ رحلتك التعليمية.
      </p>

      <Link
        href="/#courses"
        className="inline-block mt-8 bg-[#7D79F1] text-white px-8 py-3 rounded-xl hover:bg-[#6965e6] transition"
      >
        تصفح الكورسات
      </Link>

    </div>
  );
}