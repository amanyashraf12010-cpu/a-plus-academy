"use client";

import { useState } from "react";



export default function CheckoutButton({
  course,
  name,
  phone,
  method,
  validate,
}: any) {
  const [loading, setLoading] = useState(false);
  
  const whatsappNumber = "+201014257625"; // غيريه برقم الأكاديمية

  const handleClick = async () => {
    if (!validate()) return;

    setLoading(true);

    const paymentLabel = method === "vodafone" ? "Vodafone Cash" : "InstaPay";

    const message = `السلام عليكم

أرغب في الاشتراك في كورس جديد.

👤 الاسم:
${name}

📞 رقم الهاتف:
${phone}

📚 الكورس:
${course.title}

💳 طريقة الدفع:
${paymentLabel}

وسأرسل صورة الإيصال الآن.`;

    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );

   
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full py-4 rounded-2xl font-bold transition duration-300 ${
        loading
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
      }`}
    >
      {loading ? "⏳ جاري التحضير..." : "📱 فتح واتساب وإرسال الإيصال"}
    </button>
  );
}