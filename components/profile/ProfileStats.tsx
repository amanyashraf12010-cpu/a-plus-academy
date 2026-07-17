export default function ProfileStats({
  profile,
}: any) {
  return (
    <div className="grid md:grid-cols-2 gap-5">

      <div className="bg-white rounded-3xl border shadow-sm p-6 text-center">

        <h3 className="text-gray-500">
          رقم الهاتف
        </h3>

        <p className="mt-3 text-xl font-bold text-[#2D2B7A]">
          {profile.phone}
        </p>

      </div>

      <div className="bg-white rounded-3xl border shadow-sm p-6 text-center">

        <h3 className="text-gray-500">
          الكورسات
        </h3>

        <p className="mt-3 text-3xl font-bold text-[#7D79F1]">
          {profile.courses}
        </p>

      </div>

    </div>
  );
}