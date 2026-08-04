"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCourseSubscriptionStatus, subscribeToFreeCourse } from "@/lib/student";
import { Loader2, PlayCircle, Clock } from "lucide-react";

export default function EnrollCard({ course }: any) {
  const router = useRouter();
  const [subStatus, setSubStatus] = useState<"approved" | "pending" | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      try {
        setChecking(true);
        const res = await getCourseSubscriptionStatus(course.id);
        setIsLoggedIn(res.isLoggedIn);
        setSubStatus(res.status);
      } catch (err) {
        console.error("خطأ أثناء التحقق من الاشتراك:", err);
      } finally {
        setChecking(false);
      }
    }
    checkSubscription();
  }, [course.id]);

  const handleFreeEnroll = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirectTo=/courses/${course.id}`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await subscribeToFreeCourse(course.id);
      if (res.success) {
        alert("🎉 تم الاشتراك في الكورس المجاني بنجاح! يمكنك البدء بالدراسة الآن.");
        setSubStatus("approved");
        router.push(`/learn/${course.id}`);
      }
    } catch (err: any) {
      alert("خطأ أثناء الاشتراك: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderEnrollButton = () => {
    if (checking) {
      return (
        <button disabled className="w-full mt-4 bg-gray-100 text-gray-500 text-base font-bold py-4 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed border">
          <Loader2 size={18} className="animate-spin text-[#7D79F1]" />
          جاري التحقق من الاشتراك...
        </button>
      );
    }

    if (isLoggedIn && subStatus === "approved") {
      const buttonColorClass = "bg-[#7D79F1] hover:bg-[#655EF0]";

      return (
        <Link href={`/learn/${course.id}`} className="w-full">
          <button className={`w-full mt-4 ${buttonColorClass} text-white text-lg font-bold py-4 rounded-2xl transition duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer`}>
            <PlayCircle size={20} />
            استمر في التعلم (أنت مشترك)
          </button>
        </Link>
      );
    }

    if (isLoggedIn && subStatus === "pending") {
      return (
        <button disabled className="w-full mt-4 bg-yellow-50 text-yellow-600 border border-yellow-250 text-sm font-bold py-4 rounded-2xl cursor-not-allowed flex items-center justify-center gap-1.5">
          <Clock size={16} className="animate-pulse" />
          الاشتراك قيد الانتظار... تواصل معنا لتأكيده
        </button>
      );
    }

    if (Number(course.price) === 0) {
      return (
        <button
          onClick={handleFreeEnroll}
          disabled={submitting}
          className="w-full mt-4 bg-gradient-to-r from-[#7D79F1] to-[#5E5AEF] hover:from-[#655EF0] hover:to-[#4A46D6] text-white text-lg font-bold py-4 rounded-2xl transition duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin text-white" />
              جاري تسجيلك مجاناً...
            </>
          ) : (
            "اشترك الآن مجاناً 🚀"
          )}
        </button>
      );
    }

    return (
      <Link href={isLoggedIn ? `/courses/${course.id}/checkout` : `/login?redirectTo=/courses/${course.id}`} className="w-full">
        <button className="w-full mt-4 bg-[#7D79F1] hover:bg-[#655EF0] text-white text-lg font-bold py-4 rounded-2xl transition duration-300 shadow-md hover:shadow-lg cursor-pointer">
          اشترك الآن
        </button>
      </Link>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border p-6 sticky top-24">
      <div className="text-center">
        <h2 className="text-4xl font-black text-[#2D2B7A] tracking-tight">
          {Number(course.price) === 0 ? (
            <span className="text-[#7D79F1] font-bold">كورس مجاني 🎉</span>
          ) : (
            `${course.price} جنيه`
          )}
        </h2>
        {renderEnrollButton()}
      </div>

      <hr className="my-6 border-gray-100" />

      <div className="space-y-4 text-gray-600 text-sm font-semibold">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">⏱️ مدة الكورس</span>
          <span className="text-gray-800">{course.duration}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">📚 عدد الدروس</span>
          <span className="text-gray-800">{course.lessons} درس</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">🎓 الصف الدراسي</span>
          <span className="text-gray-800">{course.grade}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">👨‍🏫 مدرس الكورس</span>
          <span className="text-gray-800">{course.teacher}</span>
        </div>
      </div>
    </div>
  );
}