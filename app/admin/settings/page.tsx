export default function AdminSettingsPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-extrabold text-[#2D2B7A]">⚙️ إعدادات المنصة</h1>
        <p className="text-gray-500 mt-1">تخصيص وإدارة إعدادات الأكاديمية العامة.</p>
      </div>

      <div className="bg-white rounded-3xl border shadow-sm p-8 max-w-xl">
        <h3 className="text-lg font-bold text-gray-700 mb-4">معلومات عامة</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">اسم المنصة</label>
            <input
              type="text"
              readOnly
              value="A+ Academy"
              className="w-full px-4 py-3 rounded-xl border bg-gray-50 outline-none text-[#2D2B7A] font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">رابط الدومين</label>
            <input
              type="text"
              readOnly
              value="https://a-aplus.com"
              className="w-full px-4 py-3 rounded-xl border bg-gray-50 outline-none text-[#2D2B7A] font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
