"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import StudentInfo from "@/components/checkout/StudentInfo";
import PaymentMethod from "@/components/checkout/PaymentMethod";
import CheckoutButton from "@/components/checkout/CheckoutButton";
import CourseSummary from "@/components/checkout/CourseSummary";

function CheckoutContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const lessonId = searchParams.get("lessonId");

  const [course, setCourse] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("vodafone");
  const [errors, setErrors] = useState({
    name: "",
    phone: "",
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // 1. Get current logged-in user profile to autofill details
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", user.id)
            .single();
            
          if (profile) {
            setName(profile.full_name || "");
            setPhone(profile.phone || "");
          }
        }

        // 2. Fetch Course Details
        const { data: dbCourse, error } = await supabase
          .from("courses")
          .select("*, teachers(name)")
          .eq("id", id)
          .single();

        if (error || !dbCourse) {
          alert("الكورس المطلوب غير متوفر.");
          router.push("/#courses");
          return;
        }

        // 3. If lessonId is provided, fetch specific lesson
        let lessonData = null;
        if (lessonId) {
          const { data: dbLesson, error: lessonError } = await supabase
            .from("lessons")
            .select("id, title, price, duration, order")
            .eq("id", lessonId)
            .single();

          if (!lessonError && dbLesson) {
            lessonData = dbLesson;
            setLesson(dbLesson);
          }
        }

        // Guard against free full course
        if (!lessonId && Number(dbCourse.price) === 0) {
          router.push(`/courses/${id}`);
          return;
        }

        setCourse({
          id: dbCourse.id,
          title: dbCourse.title,
          teacher: dbCourse.teachers?.name || "مدرس الأكاديمية",
          price: dbCourse.price,
          grade: dbCourse.grade,
          duration: dbCourse.duration,
          lessons: dbCourse.video_count,
          image: dbCourse.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600"
        });
      } catch (error) {
        console.error("فشل جلب بيانات الاشتراك:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, lessonId]);

  const validate = () => {
    const newErrors = {
      name: "",
      phone: "",
    };

    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "من فضلك أدخل اسمك بالكامل";
      isValid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = "من فضلك أدخل رقم الهاتف";
      isValid = false;
    } else if (!/^01[0125][0-9]{8}$/.test(phone)) {
      newErrors.phone = "رقم الهاتف غير صحيح";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]" dir="rtl">
        <p className="text-[#2D2B7A] font-bold text-lg">جاري تحميل بيانات الكورس والدفع...</p>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-black" dir="rtl">

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-10">
        <div className="rounded-3xl bg-gradient-to-r from-[#7D79F1] to-[#5E5AEF] text-white p-8 md:p-10 shadow-lg">

          <h1 className="text-3xl md:text-4xl font-bold">
            {lesson ? `💳 إتمام الاشتراك في حصة: ${lesson.title}` : "💳 إتمام الاشتراك"}
          </h1>

          <p className="mt-3 text-white/90">
            {lesson 
              ? `أكمل بياناتك لتأكيد الاشتراك في هذه الحصة من كورس ${course.title}.`
              : "أكمل بياناتك واختر طريقة الدفع لإتمام الاشتراك."}
          </p>

        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-16">

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Side */}
          <div className="lg:col-span-2 space-y-6">

            <StudentInfo
              name={name}
              phone={phone}
              setName={setName}
              setPhone={setPhone}
              errors={errors}
            />

            <PaymentMethod
              method={method}
              setMethod={setMethod}
            />

            <CheckoutButton
              course={course}
              lesson={lesson}
              name={name}
              phone={phone}
              method={method}
              validate={validate}
            />

          </div>

          {/* Right Side */}
          <div className="lg:col-start-3">
            <CourseSummary course={course} lesson={lesson} />
          </div>

        </div>

      </div>

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]" dir="rtl">
        <p className="text-[#2D2B7A] font-bold text-lg">جاري تحميل صفحة الدفع...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}