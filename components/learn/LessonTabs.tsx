"use client";

import { useState } from "react";

export default function LessonTabs() {
  const [activeTab, setActiveTab] = useState("description");

  return (
    <div className="bg-white rounded-3xl border shadow-sm mt-8">

      {/* Tabs */}
      <div className="flex border-b">

        <button
          onClick={() => setActiveTab("description")}
          className={`flex-1 py-4 font-semibold transition ${
            activeTab === "description"
              ? "text-[#7D79F1] border-b-2 border-[#7D79F1]"
              : "text-gray-500"
          }`}
        >
          الوصف
        </button>

        <button
          onClick={() => setActiveTab("files")}
          className={`flex-1 py-4 font-semibold transition ${
            activeTab === "files"
              ? "text-[#7D79F1] border-b-2 border-[#7D79F1]"
              : "text-gray-500"
          }`}
        >
          الملفات
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={`flex-1 py-4 font-semibold transition ${
            activeTab === "notes"
              ? "text-[#7D79F1] border-b-2 border-[#7D79F1]"
              : "text-gray-500"
          }`}
        >
          الملاحظات
        </button>

      </div>

      {/* Content */}

      <div className="p-6">

        {activeTab === "description" && (
          <div>

            <h3 className="font-bold text-xl text-[#2D2B7A] mb-4">
              عن هذا الدرس
            </h3>

            <p className="text-gray-600 leading-8">
              هنا هيظهر شرح الدرس والوصف الخاص بيه.
              بعد ربط الباك إند هيتم جلب البيانات تلقائيًا.
            </p>

          </div>
        )}

        {activeTab === "files" && (
          <div>

            <h3 className="font-bold text-xl text-[#2D2B7A] mb-4">
              ملفات الدرس
            </h3>

            <div className="border rounded-2xl p-5 flex justify-between items-center">

              <span>
                📄 ملزمة الدرس.pdf
              </span>

              <button className="bg-[#7D79F1] text-white px-5 py-2 rounded-xl hover:bg-[#6965e6] transition">
                تحميل
              </button>

            </div>

          </div>
        )}

        {activeTab === "notes" && (
          <div>

            <h3 className="font-bold text-xl text-[#2D2B7A] mb-4">
              ملاحظات
            </h3>

            <textarea
              placeholder="اكتب ملاحظاتك هنا..."
              className="w-full h-44 border rounded-2xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#7D79F1]"
            />

          </div>
        )}

      </div>

    </div>
  );
}