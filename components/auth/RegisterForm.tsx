"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, AlertTriangle, Home, X } from "lucide-react";
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
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show the red warning modal automatically after 5 seconds from registration success
  useEffect(() => {
    if (isRegistered) {
      const timer = setTimeout(() => {
        setShowWarningModal(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isRegistered]);

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
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  // When registered: Show title, timeframe, and home button across the screen + 5s red warning modal popup
  if (isRegistered) {
    return (
      <div className="w-full flex flex-col items-center justify-center text-center py-8 sm:py-12 space-y-6 animate-in fade-in duration-300">
        {/* Success Icon */}
        <div className="relative mb-2">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-inner">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white">
              <CheckCircle2 className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2.5]" />
            </div>
          </div>
          <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 items-center justify-center text-white text-xs font-bold">✓</span>
          </span>
        </div>

        {/* 1. Main Title - Spans Across Screen */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#2D2B7A] tracking-tight leading-snug">
          تم إنشاء حسابك بنجاح 🎉
        </h1>

        {/* 2. Review Timeframe */}
        <div className="flex items-center justify-center gap-2.5 text-base sm:text-xl font-bold text-gray-700">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#7D79F1] shrink-0" />
          <span>سيتم مراجعة وقبول حسابك خلال 24 ساعة كحد أقصى.</span>
        </div>

        {/* 3. Instruction */}
        <p className="text-gray-500 text-sm sm:text-base font-medium max-w-md leading-relaxed">
          بعد قبول الحساب، يمكنك تسجيل الدخول والبدء في استخدام المنصة.
        </p>

        {/* 4. Go to Home Page Button */}
        <div className="pt-4 w-full sm:w-auto">
          <Link
            href="/"
            className="w-full sm:w-auto min-w-[280px] inline-flex items-center justify-center gap-3 bg-[#7D79F1] hover:bg-[#655EF0] text-white font-black text-lg py-4 px-10 rounded-2xl shadow-lg shadow-[#7D79F1]/30 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Home className="w-5 h-5" />
            <span>الذهاب إلى الصفحة الرئيسية</span>
          </Link>
        </div>

        {/* 5. Red Warning Modal Popup (Appears after 5 seconds on top) */}
        {mounted && showWarningModal && typeof document !== "undefined" && createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Dimmed Background Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWarningModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Red Warning Box in Center */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative z-10 w-full max-w-md bg-white border-2 border-red-500 rounded-3xl p-6 sm:p-8 shadow-[0_15px_50px_rgba(239,68,68,0.3)] text-center flex flex-col items-center my-auto mx-auto"
            >
              {/* Close Button (X in corner) */}
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                aria-label="إغلاق التنبيه"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Red Warning Icon */}
              <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center mb-4 mt-1 shadow-inner">
                <AlertTriangle className="w-8 h-8 stroke-[2.5] text-red-600 animate-pulse" />
              </div>

              {/* Red Title */}
              <h3 className="text-2xl font-black text-red-600 mb-3">
                تنبيه هام ⚠️
              </h3>

              {/* Red Warning Message */}
              <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-center">
                <p className="text-red-950 font-black text-base sm:text-lg leading-relaxed">
                  برجاء عدم تسجيل حساب جديد مرة أخرى، وانتظار تفعيل حسابك من الإدارة.
                </p>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black text-base py-3.5 px-6 rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>فهمت ذلك (إغلاق التنبيه)</span>
              </button>
            </motion.div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
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
  );
}