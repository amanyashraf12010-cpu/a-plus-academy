"use client";

import { useState } from "react";

export default function CompleteLessonButton() {

  const [completed, setCompleted] = useState(false);

  return (

    <button
      onClick={() => setCompleted(true)}
      className={`w-full mt-8 py-4 rounded-2xl font-bold transition ${
        completed
          ? "bg-green-600 text-white"
          : "bg-[#7D79F1] hover:bg-[#6965E6] text-white"
      }`}
    >

      {completed
        ? "✅ تم إنهاء الدرس"
        : "✔️ إنهاء الدرس"}

    </button>

  );
}
