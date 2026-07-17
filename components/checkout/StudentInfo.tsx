"use client";

import { User, Phone } from "lucide-react";

export default function StudentInfo({
  name,
  phone,
  setName,
  setPhone,
  errors,
}: any) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border">

      <h2 className="text-xl font-bold text-[#2D2B7A] mb-6">
        بيانات الطالب
      </h2>

      <div className="space-y-5">

        {/* Name */}
        <div>

          <label className="block mb-2 text-sm font-medium text-gray-700">
            الاسم بالكامل
          </label>

          <div className="relative">

            <User
              size={20}
              className="absolute left-4 top-4 text-gray-400"
            />

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسمك بالكامل"
              className={`w-full rounded-2xl py-3 pl-12 pr-4 text-black placeholder:text-gray-400 transition focus:outline-none focus:ring-2 ${
                errors?.name
                  ? "border border-red-500 focus:ring-red-400"
                  : "border border-gray-300 focus:ring-[#7D79F1] focus:border-[#7D79F1]"
              }`}
            />

          </div>

          {errors?.name && (
            <p className="text-red-500 text-sm mt-2">
              {errors.name}
            </p>
          )}

        </div>

        {/* Phone */}
        <div>

          <label className="block mb-2 text-sm font-medium text-gray-700">
            رقم الهاتف
          </label>

          <div className="relative">

            <Phone
              size={20}
              className="absolute left-4 top-4 text-gray-400"
            />

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              className={`w-full rounded-2xl py-3 pl-12 pr-4 text-black placeholder:text-gray-400 transition focus:outline-none focus:ring-2 ${
                errors?.phone
                  ? "border border-red-500 focus:ring-red-400"
                  : "border border-gray-300 focus:ring-[#7D79F1] focus:border-[#7D79F1]"
              }`}
            />

          </div>

          {errors?.phone && (
            <p className="text-red-500 text-sm mt-2">
              {errors.phone}
            </p>
          )}

        </div>

      </div>

    </div>
  );
}