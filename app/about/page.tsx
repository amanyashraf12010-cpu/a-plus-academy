export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
      <div className="max-w-xl bg-white p-10 rounded-3xl border shadow-sm space-y-4">
        <span className="text-4xl">🎓</span>
        <h1 className="text-3xl font-extrabold text-[#2D2B7A]">من نحن - A+ Academy</h1>
        <p className="text-gray-500 leading-relaxed">
          منصة تعليمية تجمع نخبة من أفضل المدرسين لمساعدة الطلاب على تحقيق التفوق الدراسي بأسهل وأحدث الطرق التفاعلية.
        </p>
      </div>
    </div>
  );
}
