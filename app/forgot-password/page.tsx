"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import { resetPasswordRequest } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("من فضلك أدخل البريد الإلكتروني.");
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorMsg("");

    try {
      const res = await resetPasswordRequest(email.trim());
      if (res.success) {
        setMessage(
          "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح! يرجى التحقق من صندوق الوارد (أو البريد المهمل)."
        );
        setEmail("");
      } else {
        setErrorMsg(res.error || "حدث خطأ ما، يرجى المحاولة مرة أخرى.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ ما، يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="نسيت كلمة المرور"
      subtitle="أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين"
    >
      <form onSubmit={handleSubmit} className="space-y-6 mt-8" dir="rtl">
        {/* Status Messages */}
        {message && (
          <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium text-center">
            {message}
          </div>
        )}

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

        {/* Submit */}
        <AuthButton type="submit" disabled={loading}>
          {loading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
        </AuthButton>

        {/* Back to Login */}
        <p className="text-center text-gray-600">
          تذكرت كلمة المرور؟
          <Link
            href="/login"
            className="mr-2 font-bold text-[#7D79F1] hover:text-[#655EF0]"
          >
            تسجيل الدخول
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
