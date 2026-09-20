"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 sm:p-6 md:p-10 overflow-y-auto min-h-screen">
        {/* Ambient Dark Purple Spotlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#7D79F1]/20 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-[#F18A2E]/10 blur-[100px] pointer-events-none" />

        {/* High-Contrast Centered Card */}
        <div className="relative z-10 w-full max-w-2xl bg-[#0F0E17] border-2 border-[#7D79F1]/40 rounded-3xl sm:rounded-[36px] p-6 sm:p-10 md:p-14 shadow-[0_0_80px_rgba(125,121,241,0.25)] text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
          {/* Glowing Success Badge */}
          <div className="relative mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.3)]">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/40 text-white">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.5]" />
              </div>
            </div>
            <span className="absolute -top-2 -right-2 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 items-center justify-center text-white text-xs font-bold">✓</span>
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-snug drop-shadow-[0_2px_15px_rgba(255,255,255,0.2)]">
            تم إنشاء حسابك بنجاح 🎉
          </h1>

          {/* Review Timeframe */}
          <div className="flex items-center justify-center gap-2.5 text-base sm:text-xl font-bold text-gray-200 mb-6">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#A5A2FF] shrink-0" />
            <span>سيتم مراجعة وقبول حسابك خلال 24 ساعة كحد أقصى.</span>
          </div>

          {/* Prominent Warning Callout */}
          <div className="w-full bg-amber-950/40 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 mb-6 text-center shadow-[0_0_25px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <p className="text-amber-200 font-black text-sm sm:text-base leading-relaxed">
              برجاء عدم تسجيل حساب جديد مرة أخرى، وانتظار تفعيل حسابك من الإدارة.
            </p>
          </div>

          {/* Instruction */}
          <p className="text-gray-300 text-sm sm:text-base font-medium mb-8 max-w-lg leading-relaxed">
            بعد قبول الحساب، يمكنك تسجيل الدخول والبدء في استخدام المنصة.
          </p>

          {/* Login Button */}
          <Link
            href="/login"
            className="w-full sm:w-auto min-w-[280px] inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#7D79F1] to-[#6C63FF] hover:from-[#6C63FF] hover:to-[#5A54E8] text-white font-black text-lg py-4 px-8 rounded-2xl shadow-[0_0_30px_rgba(125,121,241,0.45)] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogIn className="w-5 h-5" />
            <span>تسجيل الدخول إلى حسابك</span>
          </Link>
        </div>
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