"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthInput from "./AuthInput";
import PasswordInput from "./PasswordInput";
import AuthButton from "./AuthButton";
import { loginUser } from "@/lib/auth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam === "not_approved") {
      setErrorMsg("حسابك قيد المراجعة حالياً. يرجى الانتظار لحين تفعيل الحساب من قبل الإدارة.");
    }
  }, [errorParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const result = await loginUser(email, password);

    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || "حدث خطأ ما، يرجى المحاولة مرة أخرى.");
      return;
    }

    // بعد نجاح الدخول
    if (result.profile.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/my-courses");
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>

      {/* Title */}
      <div>
        <h1 className="text-4xl font-extrabold text-[#02343F]">
          أهلاً بعودتك 👋
        </h1>
      </div>

      {/* Alert Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium text-center">
          {errorMsg}
        </div>
      )}

      {/* Email */}
      <AuthInput
        label="البريد الإلكتروني"
        placeholder="example@email.com"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {/* Password */}
      <PasswordInput
        label="كلمة المرور"
        placeholder=""
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Remember & Forgot */}
      <div className="flex items-center justify-between text-sm">

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 accent-[#7D79F1]"
          />

          <span className="text-gray-600">
            تذكرني
          </span>
        </label>

        <Link
          href="/forgot-password"
          className="font-medium text-[#7D79F1] hover:text-[#655EF0]"
        >
          نسيت كلمة المرور؟
        </Link>

      </div>

      {/* Button */}
      <AuthButton type="submit" disabled={loading}>
        {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
      </AuthButton>

      {/* Register */}
      <p className="text-center text-gray-600">
        ليس لديك حساب؟

        <Link
          href="/register"
          className="mr-2 font-bold text-[#7D79F1] hover:text-[#655EF0]"
        >
          إنشاء حساب
        </Link>

      </p>

    </form>
  );
}