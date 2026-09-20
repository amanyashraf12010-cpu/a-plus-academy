"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertTriangle, LogIn, X } from "lucide-react";
import AuthInput from "./AuthInput";
import AuthButton from "./AuthButton";
import PasswordInput from "./PasswordInput";
import { registerUser } from "@/lib/auth";

export default function RegisterForm() {
  const [system, setSystem] = useState("");
  const [track, setTrack] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [school, setSchool] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [gender, setGender] = useState("");
  const [grade, setGrade] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentJob, setParentJob] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const getTracks = () => {
    if (!grade) return [];

    if (grade === "first") {
      return [];
    }

    if (grade === "second") {
      if (system.includes("baccalaureate")) {
        return [
          "المسار الطبي وعلوم الحياة",
          "مسار الهندسة وعلوم الحاسب",
          "مسار الأعمال",
          "مسار الآداب والفنون"
        ];
      }
      if (system === "general") {
        return ["علمي علوم", "علمي رياضة", "أدبي"];
      }
      if (system === "azhar") {
        return ["علمي أزهر", "أدبي أزهر"];
      }
    }

    if (grade === "third") {
      if (system === "azhar" || system === "azhar_baccalaureate") {
        return ["علمي أزهر", "أدبي أزهر"];
      }
      if (system === "general" || system === "general_baccalaureate") {
        return ["علمي علوم", "علمي رياضة", "أدبي"];
      }
    }

    return [];
  };

  const getCleanData = () => {
    const cleanEmail = email.trim().toLowerCase();
    const normalizePhone = (num: string) => {
      let clean = num.trim()
        .replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
        .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
      clean = clean.replace(/[\s-()]/g, "");
      if (clean.startsWith("+2")) clean = clean.substring(2);
      if (clean.startsWith("002")) clean = clean.substring(3);
      if (clean.startsWith("2") && clean.length === 12) clean = clean.substring(1);
      return clean;
    };
    return {
      cleanEmail,
      cleanPhone: normalizePhone(phone),
      cleanParentPhone: normalizePhone(parentPhone),
      cleanFullName: fullName.trim(),
      cleanSchool: school.trim(),
      cleanParentJob: parentJob.trim()
    };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const { cleanEmail, cleanPhone, cleanParentPhone, cleanFullName, cleanSchool, cleanParentJob } = getCleanData();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^01[0125][0-9]{8}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

    if (!cleanFullName) newErrors.fullName = "الاسم الثلاثي مطلوب";
    if (!emailRegex.test(cleanEmail)) newErrors.email = "البريد الإلكتروني غير صحيح";
    if (!phoneRegex.test(cleanPhone)) newErrors.phone = "رقم الهاتف غير صحيح";
    if (!phoneRegex.test(cleanParentPhone)) newErrors.parentPhone = "رقم ولي الأمر غير صحيح";
    if (cleanPhone === cleanParentPhone)
      newErrors.parentPhone = "رقم ولي الأمر يجب أن يكون مختلفًا عن رقم الطالب";
    if (!cleanSchool) newErrors.school = "اسم المدرسة مطلوب";
    if (!governorate) newErrors.governorate = "اختر المحافظة";
    if (!gender) newErrors.gender = "اختر النوع";
    if (!system) newErrors.system = "اختر النظام";
    if (grade !== "first" && grade !== "prep3" && !track) newErrors.track = "اختر التخصص";
    if (!grade) newErrors.grade = "اختر الصف";
    if (!cleanParentJob) newErrors.parentJob = "أدخل مهنة ولي الأمر";
    if (!passwordRegex.test(password))
      newErrors.password = "كلمة المرور يجب أن تكون 8 خانات على الأقل.";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "كلمة المرور غير متطابقة";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const { cleanEmail, cleanPhone, cleanParentPhone, cleanFullName, cleanSchool, cleanParentJob } = getCleanData();

    const result = await registerUser({
      email: cleanEmail,
      password,
      fullName: cleanFullName,
      phone: cleanPhone,
      parentPhone: cleanParentPhone,
      parentJob: cleanParentJob,
      school: cleanSchool,
      governorate,
      gender,
      educationSystem: system,
      track: (grade === "first" || grade === "prep3") ? "عام" : track,
      grade,
    });

    setLoading(false);

    if (result.success) {
      setIsRegistered(true);
    } else {
      setErrors({ email: result.error || "حدث خطأ، حاول مرة أخرى" });
    }
  };

  const getSelectClass = (hasError: boolean) =>
    `w-full rounded-2xl bg-white px-4 py-3 text-[#2D2B7A] outline-none transition focus:ring-2 ${
      hasError
        ? "border-2 border-red-500 focus:ring-red-200"
        : "border border-gray-200 focus:border-[#7D79F1] focus:ring-[#7D79F1]/20"
    }`;

  return (
    <>
      <form
        onSubmit={handleRegister}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
      {/* 1. Full Name */}
      <div className="md:col-span-2">
        <AuthInput
          label="الاسم الثلاثي"
          placeholder="ادخل الاسم الثلاثي"
          value={fullName}
          error={errors.fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      {/* 2. Phone & Email */}
      <AuthInput
        label="رقم الهاتف"
        placeholder="ادخل رقم الهاتف"
        value={phone}
        error={errors.phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <AuthInput
        label="البريد الإلكتروني"
        placeholder="ادخل البريد الإلكتروني"
        value={email}
        error={errors.email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {/* 3. School & Governorate */}
      <AuthInput
        label="اسم المدرسة"
        placeholder="ادخل اسم المدرسة"
        value={school}
        error={errors.school}
        onChange={(e) => setSchool(e.target.value)}
      />

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#02343F]">
          المحافظة
        </label>
        <select
          className={getSelectClass(!!errors.governorate)}
          value={governorate}
          onChange={(e) => setGovernorate(e.target.value)}
        >
          <option value="">اختر المحافظة</option>
          <option>القاهرة</option>
          <option>الجيزة</option>
          <option>الإسكندرية</option>
          <option>الدقهلية</option>
          <option>الشرقية</option>
          <option>الغربية</option>
          <option>المنوفية</option>
          <option>القليوبية</option>
          <option>البحيرة</option>
          <option>كفر الشيخ</option>
          <option>دمياط</option>
          <option>بورسعيد</option>
          <option>الإسماعيلية</option>
          <option>السويس</option>
          <option>شمال سيناء</option>
          <option>جنوب سيناء</option>
          <option>بني سويف</option>
          <option>الفيوم</option>
          <option>المنيا</option>
          <option>أسيوط</option>
          <option>سوهاج</option>
          <option>قنا</option>
          <option>الأقصر</option>
          <option>أسوان</option>
          <option>الوادي الجديد</option>
          <option>مطروح</option>
        </select>
        {errors.governorate && (
          <p className="text-sm text-red-500 font-medium">{errors.governorate}</p>
        )}
      </div>

      {/* 4. Gender & Grade */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#02343F]">
          النوع
        </label>
        <select
          className={getSelectClass(!!errors.gender)}
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">اختر النوع</option>
          <option value="male">ذكر</option>
          <option value="female">أنثى</option>
        </select>
        {errors.gender && (
          <p className="text-sm text-red-500 font-medium">{errors.gender}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#02343F]">
          الصف الدراسي
        </label>
        <select
          className={getSelectClass(!!errors.grade)}
          value={grade}
          onChange={(e) => {
            setGrade(e.target.value);
            setTrack(""); // Clear track choice when switching grades
          }}
        >
          <option value="">اختر الصف</option>
          <option value="prep3">الصف الثالث الإعدادي</option>
          <option value="first">الصف الأول الثانوي</option>
          <option value="second">الصف الثاني الثانوي</option>
          <option value="third">الصف الثالث الثانوي</option>
        </select>
        {errors.grade && (
          <p className="text-sm text-red-500 font-medium">{errors.grade}</p>
        )}
      </div>

      {/* 5. System & Track */}
      <div className={`space-y-2 ${(grade === "first" || grade === "prep3") ? "md:col-span-2" : ""}`}>
        <label className="block text-sm font-semibold text-[#02343F]">
          النظام التعليمي
        </label>
        <select
          className={getSelectClass(!!errors.system)}
          value={system}
          onChange={(e) => {
            setSystem(e.target.value);
            setTrack("");
          }}
        >
          <option value="">اختر النظام</option>
          <option value="general">عام</option>
          <option value="azhar">أزهر</option>
          <option value="general_baccalaureate">عام (بكالوريا)</option>
          <option value="azhar_baccalaureate">أزهر (بكالوريا)</option>
        </select>
        {errors.system && (
          <p className="text-sm text-red-500 font-medium">{errors.system}</p>
        )}
      </div>

      {grade !== "first" && grade !== "prep3" && system && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#02343F]">
            التخصص / الشعبة
          </label>
          <select
            className={getSelectClass(!!errors.track)}
            value={track}
            onChange={(e) => setTrack(e.target.value)}
          >
            <option value="">اختر التخصص</option>
            {getTracks().map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.track && (
            <p className="text-sm text-red-500 font-medium">{errors.track}</p>
          )}
        </div>
      )}

      {/* 6. Parent Phone & Parent Job */}
      <AuthInput
        label="رقم ولي الأمر"
        placeholder="ادخل رقم ولي الأمر"
        value={parentPhone}
        error={errors.parentPhone}
        onChange={(e) => setParentPhone(e.target.value)}
      />

      <AuthInput
        label="مهنة ولي الأمر"
        placeholder="ادخل مهنة ولي الأمر"
        value={parentJob}
        error={errors.parentJob}
        onChange={(e) => setParentJob(e.target.value)}
      />

      {/* 7. Password & Confirm Password */}
      <PasswordInput
        label="كلمة المرور"
        placeholder="ادخل كلمة المرور"
        value={password}
        error={errors.password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <PasswordInput
        label="تأكيد كلمة المرور"
        placeholder="تأكيد كلمة المرور"
        value={confirmPassword}
        error={errors.confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      {/* Submit Button */}
      <div className="md:col-span-2">
        <AuthButton type="submit" disabled={loading}>
          {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
        </AuthButton>
      </div>
    </form>

    {/* Confirmation Modal Popup - Small Centered Box */}
    {mounted && isRegistered && typeof document !== "undefined" && createPortal(
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 overflow-y-auto">
        {/* Dimmed Background Overlay (الصفحة باهتة وراها) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsRegistered(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        />

        {/* Small Centered Modal Card (مربع صغير في نص الصفحة) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-purple-100 text-center flex flex-col items-center my-auto mx-auto"
        >
          {/* Close Button (علامة X في طرف المربع) */}
          <button
            type="button"
            onClick={() => setIsRegistered(false)}
            className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Small Success Icon */}
          <div className="relative mb-3 mt-1">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/30 text-white">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 items-center justify-center text-white text-[9px] font-bold">✓</span>
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-black text-[#2D2B7A] tracking-tight mb-2 leading-snug">
            تم إنشاء حسابك بنجاح 🎉
          </h2>

          {/* Review Timeframe */}
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-gray-600 mb-3">
            <Clock className="w-4 h-4 text-[#7D79F1] shrink-0" />
            <span>سيتم مراجعة وقبول حسابك خلال 24 ساعة كحد أقصى.</span>
          </div>

          {/* Warning Callout Box */}
          <div className="w-full bg-amber-50 border border-amber-300 rounded-xl p-3 mb-3 text-center flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-amber-950 font-bold text-xs sm:text-sm leading-snug">
              برجاء عدم تسجيل حساب جديد مرة أخرى، وانتظار تفعيل حسابك من الإدارة.
            </p>
          </div>

          {/* Instruction */}
          <p className="text-gray-500 text-xs sm:text-sm font-medium mb-4 leading-relaxed">
            بعد قبول الحساب، يمكنك تسجيل الدخول والبدء في استخدام المنصة.
          </p>

          {/* Login Button */}
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#7D79F1] hover:bg-[#655EF0] text-white font-bold text-base py-3 px-6 rounded-xl shadow-md shadow-[#7D79F1]/25 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول إلى حسابك</span>
          </Link>
        </motion.div>
      </div>,
      document.body
    )}
  </>
  );
}