"use client";

import { useState } from "react";

import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileActions from "@/components/profile/ProfileActions";

export default function ProfilePage() {

  const [profile] = useState({
    full_name: "أماني أشرف",
    email: "example@email.com",
    phone: "01000000000",
    grade: "تالتة ثانوي",
    education_system: "عام",
    track: "علمي علوم",
  });


  return (
    <div className="min-h-screen bg-[#F8F9FD]">

      {/* Title */}
      <div className="text-center py-10">

        <h1 className="text-4xl font-bold text-[#2D2B7A]">
          👤 الملف الشخصي
        </h1>

        <p className="text-gray-500 mt-2">
          إدارة بيانات حسابك
        </p>

      </div>


      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 pb-16 space-y-6">

        <ProfileHeader profile={profile} />

        <ProfileStats profile={profile} />

        <ProfileActions />

      </div>

    </div>
  );
}