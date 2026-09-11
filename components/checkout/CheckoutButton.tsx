"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function CheckoutButton({
  course,
  lesson,
  name,
  phone,
  method,
  validate,
}: {
  course: any;
  lesson?: any;
  name: string;
  phone: string;
  method: string;
  validate: () => boolean;
}) {
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
        // 2. إدخال أو تحديث الاشتراك في قاعدة البيانات كطلب معلق لكي يظهر للأدمن في لوحة التحكم
        if (lesson) {
          // Check if there is an existing pending/rejected subscription for this specific lesson
          const { data: existingLessonSub } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", course.id)
            .eq("lesson_id", lesson.id)
            .maybeSingle();

          if (existingLessonSub) {
            await supabase
              .from("subscriptions")
              .update({
                payment_method: method === "vodafone" ? "vodafone_cash" : "instapay",
                status: "pending",
                receipt_url: null,
                created_at: new Date().toISOString()
              })
              .eq("id", existingLessonSub.id);
          } else {
            await supabase
              .from("subscriptions")
              .insert([
                {
                  user_id: user.id,
                  course_id: course.id,
                  lesson_id: lesson.id,
                  payment_method: method === "vodafone" ? "vodafone_cash" : "instapay",
                  status: "pending",
                  receipt_url: null
                }
              ]);
          }
        } else {
          // Full course subscription
          await supabase
            .from("subscriptions")
            .upsert(
              [
                {
                  user_id: user.id,
                  course_id: course.id,
                  lesson_id: null,
                  payment_method: method === "vodafone" ? "vodafone_cash" : "instapay",
                  status: "pending",
                  receipt_url: null
                }
              ],
              { onConflict: "user_id,course_id" }
            )
            .select();
        }
      }
    } catch (error) {
      console.error("فشل تسجيل الاشتراك في قاعدة البيانات:", error);
    }

    const paymentLabel = method === "vodafone" ? "Vodafone Cash" : "InstaPay";

    let message = "";
    if (lesson) {
      message = `السلام عليكم

أرغب في الاشتراك في حصة جديدة.

👤 الاسم:
${name}

📞 رقم الهاتف:
${phone}

📚 الكورس:
${course.title}

📖 الحصة:
${lesson.title}

💰 سعر الحصة:
${lesson.price || 0} جنيه

💳 طريقة الدفع:
${paymentLabel}

وسأرسل صورة الإيصال الآن.`;
    } else {
      message = `السلام عليكم

أرغب في الاشتراك في كورس جديد.

👤 الاسم:
${name}

📞 رقم الهاتف:
${phone}

📚 الكورس:
${course.title}

💰 سعر الكورس:
${course.price} جنيه

💳 طريقة الدفع:
${paymentLabel}

وسأرسل صورة الإيصال الآن.`;
    }

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