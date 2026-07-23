export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
      <div className="max-w-xl bg-white p-10 rounded-3xl border shadow-sm space-y-4">
        <span className="text-4xl">📞</span>
        <h1 className="text-3xl font-extrabold text-[#2D2B7A]">تواصل معنا</h1>
        <p className="text-gray-500 leading-relaxed">
          لديك أي استفسار أو واجهتك مشكلة؟ تواصل معنا مباشرة عبر الواتساب وسنقوم بالرد عليك في أقرب وقت.
        </p>
        <div className="pt-4">
          <a
            href="https://wa.me/201014257625"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#7D79F1] hover:bg-[#655EF0] text-white px-8 py-3.5 rounded-xl font-bold transition shadow-md"
          >
            تواصل معنا عبر واتساب 💬
          </a>
        </div>
      </div>
    </div>
  );
}
