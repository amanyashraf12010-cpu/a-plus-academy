"use client";

import { useState } from "react";
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
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getTracks = () => {
    if (system === "azhar") {
      return ["علمي أزهر", "أدبي أزهر"];
    }

    if (system === "general") {
      return ["علمي علوم", "علمي رياضة", "أدبي"];
    }

    return [];
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^01[0125][0-9]{8}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

    if (!fullName.trim()) newErrors.fullName = "الاسم الثلاثي مطلوب";
    if (!emailRegex.test(email)) newErrors.email = "البريد الإلكتروني غير صحيح";
    if (!phoneRegex.test(phone)) newErrors.phone = "رقم الهاتف غير صحيح";
    if (!phoneRegex.test(parentPhone)) newErrors.parentPhone = "رقم ولي الأمر غير صحيح";
    if (phone === parentPhone)
      newErrors.parentPhone = "رقم ولي الأمر يجب أن يكون مختلفًا عن رقم الطالب";
    if (!school.trim()) newErrors.school = "اسم المدرسة مطلوب";
    if (!governorate) newErrors.governorate = "اختر المحافظة";
    if (!gender) newErrors.gender = "اختر النوع";
    if (!system) newErrors.system = "اختر النظام";
    if (!track) newErrors.track = "اختر التخصص";
    if (!grade) newErrors.grade = "اختر الصف";
    if (!parentJob.trim()) newErrors.parentJob = "أدخل مهنة ولي الأمر";
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
    setSuccess("");

    const result = await registerUser({
      email,
      password,
      fullName,
      phone,
      parentPhone,
      parentJob,
      school,
      governorate,
      gender,
      educationSystem: system,
      track,
      grade,
    });

    setLoading(false);

    if (result.success) {
      setSuccess("تم إنشاء الحساب بنجاح 🎉 في انتظار موافقة الإدارة");
    } else {
      setErrors({ email: result.error || "حدث خطأ، حاول مرة أخرى" });
    }
  };

  const selectClass =
    "w-full rounded-2xl border-2 border-[#7D79F1] bg-white px-4 py-4 text-[#2D2B7A] font-medium outline-none focus:ring-4 focus:ring-[#7D79F1]/20 transition";

  return (
    <form
      onSubmit={handleRegister}
      className="grid grid-cols-1 md:grid-cols-2 gap-5"
    >
      {/* Full Name */}
      <div className="md:col-span-2">
        <AuthInput
          label="الاسم الثلاثي"
          placeholder="ادخل الاسم الثلاثي"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      {/* Phone */}
      <AuthInput
        label="رقم الهاتف"
        placeholder="ادخل رقم الهاتف"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      {/* School */}
      <AuthInput
        label="اسم المدرسة"
        placeholder="ادخل اسم المدرسة"
        value={school}
        error={errors.school}
        onChange={(e) => setSchool(e.target.value)}
      />

      {/* Governorate */}
      <div>
        <select
          className={selectClass}
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
          <p className="text-sm text-red-500 font-medium mt-2">{errors.governorate}</p>
        )}
      </div>

      {/* Gender */}
      <div>
        <select
          className={selectClass}
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">اختر النوع</option>
          <option value="male">ذكر</option>
          <option value="female">أنثى</option>
        </select>
        {errors.gender && (
          <p className="text-sm text-red-500 font-medium mt-2">{errors.gender}</p>
        )}
      </div>

      {/* System */}
      <div>
        <select
          className={selectClass}
          value={system}
          onChange={(e) => {
            setSystem(e.target.value);
            setTrack("");
          }}
        >
          <option value="">اختر النظام</option>
          <option value="general">عام</option>
          <option value="azhar">أزهر</option>
        </select>
        {errors.system && (
          <p className="text-sm text-red-500 font-medium mt-2">{errors.system}</p>
        )}
      </div>

      {/* Track */}
      {system && (
        <div>
          <select
            className={selectClass}
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
            <p className="text-sm text-red-500 font-medium mt-2">{errors.track}</p>
          )}
        </div>
      )}

      {/* Grade */}
      <div>
        <select
          className={selectClass}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        >
          <option value="">اختر الصف</option>
          <option value="first">أولى ثانوي</option>
          <option value="second">تانية ثانوي</option>
          <option value="third">تالتة ثانوي</option>
        </select>
        {errors.grade && (
          <p className="text-sm text-red-500 font-medium mt-2">{errors.grade}</p>
        )}
      </div>

      {/* Parent Job */}
      <AuthInput
        label="مهنة ولي الأمر"
        placeholder="ادخل مهنة ولي الأمر"
        value={parentJob}
        error={errors.parentJob}
        onChange={(e) => setParentJob(e.target.value)}
      />

      {/* Parent Phone */}
      <AuthInput
        label="رقم ولي الأمر"
        placeholder="ادخل رقم ولي الأمر"
        value={parentPhone}
        error={errors.parentPhone}
        onChange={(e) => setParentPhone(e.target.value)}
      />

      {/* Email */}
      <AuthInput
        label="البريد الإلكتروني"
        placeholder="ادخل البريد الإلكتروني"
        value={email}
        error={errors.email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {/* Password */}
      <PasswordInput
        label="كلمة المرور"
        placeholder="ادخل كلمة المرور"
        value={password}
        error={errors.password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Confirm Password */}
      <PasswordInput
        label="تأكيد كلمة المرور"
        placeholder="تأكيد كلمة المرور"
        value={confirmPassword}
        error={errors.confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      {/* Submit Button */}
      {success && (
        <div className="md:col-span-2 rounded-2xl bg-green-50 border border-green-200 p-4 text-green-700 text-center font-medium">
          {success}
        </div>
      )}

      <div className="md:col-span-2">
        <AuthButton type="submit" disabled={loading}>
          {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
        </AuthButton>
      </div>
    </form>
  );
}