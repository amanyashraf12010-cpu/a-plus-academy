export default function ProfileStats({
  profile,
}: any) {
  return (
    <div className="grid md:grid-cols-2 gap-5" dir="rtl">

      {/* Phone */}
      <div className="bg-white rounded-3xl border shadow-sm p-6 text-center">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          رقم الهاتف
        </h3>
        <p className="mt-2 text-xl font-bold text-[#2D2B7A]">
          {profile.phone}
        </p>
      </div>

      {/* Active Courses */}
      <div className="bg-white rounded-3xl border shadow-sm p-6 text-center">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          الكورسات المشترك بها
        </h3>
        <p className="mt-2 text-3xl font-extrabold text-[#7D79F1]">
          {profile.courses}
        </p>
      </div>

      {/* Grade */}
      <div className="bg-white rounded-3xl border shadow-sm p-6 text-center">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          الصف الدراسي
        </h3>
        <p className="mt-2 text-lg font-bold text-[#2D2B7A]">
          {profile.grade}
        </p>
      </div>

      {/* Education System & Track */}
      <div className="bg-white rounded-3xl border shadow-sm p-6 text-center">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          نظام التعليم والتخصص
        </h3>
        <p className="mt-2 text-lg font-bold text-[#2D2B7A]">
          {profile.education_system} - {profile.track}
        </p>
      </div>

      {/* School */}
      <div className="bg-white rounded-3xl border shadow-sm p-6 text-center">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          المدرسة
        </h3>
        <p className="mt-2 text-lg font-bold text-[#2D2B7A]">
          {profile.school}
        </p>
      </div>

      {/* Governorate */}
      <div className="bg-white rounded-3xl border shadow-sm p-6 text-center">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          المحافظة
        </h3>
        <p className="mt-2 text-lg font-bold text-[#2D2B7A]">
          {profile.governorate}
        </p>
      </div>

      {/* Parent Phone */}
      <div className="bg-white rounded-3xl border shadow-sm p-6 text-center md:col-span-2">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          هاتف ولي الأمر
        </h3>
        <p className="mt-2 text-lg font-bold text-[#2D2B7A]">
          {profile.parent_phone} ({profile.parent_job})
        </p>
      </div>

    </div>
  );
}