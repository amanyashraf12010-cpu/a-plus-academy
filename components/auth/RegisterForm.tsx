"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertTriangle, LogIn } from "lucide-react";
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

  useEffect(() => {
    if (isRegistered) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
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

  if (isRegistered) {
    const confirmationScreen = (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="!fixed !inset-0 !top-0 !left-0 !right-0 !bottom-0 !w-screen !h-screen !min-h-screen !z-[999999999] flex flex-col items-center justify-center !bg-black p-6 sm:p-12 md:p-20 overflow-y-auto"
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", zIndex: 999999999, backgroundColor: "#000000" }}
      >
        {/* Expansive Ambient Background Glows */}
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[900px] w-[900px] rounded-full bg-[#7D79F1]/25 blur-[160px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-10 right-1/4 h-[600px] w-[600px] rounded-full bg-[#F18A2E]/15 blur-[150px] pointer-events-none"
        />

        {/* Completely Open, Full-Width Content (NO BOX / NO BORDER CONTAINER) */}
        <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center justify-center text-center space-y-6 sm:space-y-9 my-auto py-12">
          {/* Animated Glowing Success Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
            className="relative"
          >
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_65px_rgba(16,185,129,0.45)]">
              <div className="w-20 h-20 sm:w-26 sm:h-26 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-500/60 text-white">
                <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 stroke-[2.5]" />
              </div>
            </div>
            <span className="absolute -top-2 -right-2 flex h-8 w-8">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-8 w-8 bg-emerald-500 items-center justify-center text-white text-base font-black shadow-lg">✓</span>
            </span>
          </motion.div>

          {/* Main Title - Huge & Completely Open Across Screen */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_35px_rgba(255,255,255,0.3)] max-w-5xl"
          >
            تم إنشاء حسابك بنجاح 🎉
          </motion.h1>

          {/* Review Timeframe - Large & Clear */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center justify-center gap-3 sm:gap-4 text-2xl sm:text-4xl font-bold text-gray-200 max-w-4xl"
          >
            <Clock className="w-8 h-8 sm:w-11 sm:h-11 text-[#A5A2FF] shrink-0" />
            <span>سيتم مراجعة وقبول حسابك خلال 24 ساعة كحد أقصى.</span>
          </motion.div>

          {/* Warning Notice - Open, Glowing Text Across Screen (NO BOX) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-amber-400 text-2xl sm:text-4xl md:text-5xl font-black max-w-6xl leading-relaxed py-3"
          >
            <AlertTriangle className="w-9 h-9 sm:w-14 sm:h-14 text-amber-400 shrink-0 animate-pulse" />
            <p className="drop-shadow-[0_0_30px_rgba(251,191,36,0.6)]">
              برجاء عدم تسجيل حساب جديد مرة أخرى، وانتظار تفعيل حسابك من الإدارة.
            </p>
          </motion.div>

          {/* Instruction */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-gray-300 text-xl sm:text-3xl font-semibold max-w-4xl leading-relaxed"
          >
            بعد قبول الحساب، يمكنك تسجيل الدخول والبدء في استخدام المنصة.
          </motion.p>

          {/* Login Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="pt-4"
          >
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-4 bg-gradient-to-r from-[#7D79F1] via-[#6C63FF] to-[#5A54E8] text-white font-black text-2xl sm:text-3xl py-5 sm:py-6 px-14 sm:px-20 rounded-full shadow-[0_0_60px_rgba(125,121,241,0.7)] hover:shadow-[0_0_90px_rgba(125,121,241,1)] transition-all duration-300"
            >
              <LogIn className="w-8 h-8 sm:w-9 sm:h-9" />
              <span>تسجيل الدخول إلى حسابك</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    );

    if (mounted && typeof document !== "undefined") {
      return createPortal(confirmationScreen, document.body);
    }
    return confirmationScreen;
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