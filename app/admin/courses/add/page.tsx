"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddCoursePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [teacher, setTeacher] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");

  const handleSubmit = () => {
    if (!title || !teacher || !price) {
      alert("من فضلك املأ كل البيانات");
      return;
    }

    // هنا لاحقًا هنربط API أو Firebase
    console.log({
      title,
      teacher,
      price,
      image,
    });

    alert("تم إضافة الكورس (مؤقتًا)");

    router.push("/admin/courses");
  };

  return (
    <div>

      <h1 className="text-3xl font-bold text-[#2D2B7A]">
        ➕ إضافة كورس جديد
      </h1>

      <p className="text-gray-500 mt-2">
        املأ بيانات الكورس وسيتم إضافته
      </p>

      <div className="bg-white border rounded-2xl p-6 mt-8 space-y-5">

        {/* Title */}
        <input
          placeholder="اسم الكورس"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-3 rounded-xl text-black"
        />

        {/* Teacher */}
        <input
          placeholder="اسم المدرس"
          value={teacher}
          onChange={(e) => setTeacher(e.target.value)}
          className="w-full border p-3 rounded-xl text-black"
        />

        {/* Price */}
        <input
          placeholder="السعر"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border p-3 rounded-xl text-black"
        />

        {/* Image */}
        <input
          placeholder="رابط الصورة"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="w-full border p-3 rounded-xl text-black"
        />

        {/* Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-[#7D79F1] text-white py-4 rounded-xl font-semibold hover:bg-[#6965e6] transition"
        >
          حفظ الكورس
        </button>

      </div>

    </div>
  );
}