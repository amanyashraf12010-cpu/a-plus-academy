"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function CheckoutButton({
  course,
  name,
  phone,
  method,
  validate,
}: any) {
  const [loading, setLoading] = useState(false);
  
  // رقم الواتساب بدون علامة الـ + لتجنب المشاكل في الرابط
  const whatsappNumber = "201014257625"; 

  const handleClick = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const supabase = createClient();
      
      // 1. الحصول على حساب الطالب المسجل حالياً
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 2. إدخال الاشتراك في قاعدة البيانات كطلب معلق لكي يظهر للأدمن في لوحة التحكم
        await supabase
          .from("subscriptions")
          .insert([
            {
              user_id: user.id,
              course_id: course.id,
              payment_method: method === "vodafone" ? "vodafone_cash" : "instapay",
              status: "pending",
              receipt_url: null // سيتم إرساله يدوياً على واتساب
            }
          ])
          .select();
      }
    } catch (error) {
      console.error("فشل تسجيل الاشتراك في قاعدة البيانات:", error);
    }

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

    // فتح واتساب الأكاديمية بالرابط الصحيح
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );

    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full py-4 rounded-2xl font-bold transition duration-300 cursor-pointer ${
        loading
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
      }`}
    >
      {loading ? "⏳ جاري التحضير..." : "📱 فتح واتساب وإرسال الإيصال"}
    </button>
  );
}