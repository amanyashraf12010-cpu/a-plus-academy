export default function ProfileHeader({
  profile,
}: any) {
  const firstLetter = profile.name?.charAt(0) || "؟";

  return (
    <div className="bg-white rounded-3xl border shadow-sm p-8 text-center">

      <div className="w-[120px] h-[120px] rounded-full mx-auto border-4 border-[#7D79F1] bg-[#7D79F1] flex items-center justify-center">
        <span className="text-white text-5xl font-bold">
          {firstLetter}
        </span>
      </div>

      <h1 className="text-3xl font-bold text-[#2D2B7A] mt-5">
        {profile.name}
      </h1>

      <p className="text-gray-500 mt-2">
        {profile.email}
      </p>

    </div>
  );
}