"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthButton from "@/components/auth/AuthButton";
import { updatePassword } from "@/lib/auth";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkSession() {
      try {
        // Wait a small moment to let Supabase client read hash parameters and populate session
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsValidSession(true);
        } else {
          setErrorMsg("رابط إعادة التعيين هذا غير صالح أو انتهت صلاحيته. يرجى طلب رابط جديد.");
        }
      } catch (err) {
        console.error("Session check error:", err);
        setErrorMsg("حدث خطأ أثناء التحقق من الرابط.");
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!password.trim()) {
      setErrorMsg("من فضلك أدخل كلمة المرور الجديدة.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("كلمتا المرور غير متطابقتين.");
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorMsg("");

    try {
      const res = await updatePassword(password);
      if (res.success) {
        setMessage("تم إعادة تعيين كلمة المرور بنجاح! جاري توجيهك لصفحة تسجيل الدخول...");
        // Sign out to clean recovery session
        await supabase.auth.signOut();
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setErrorMsg(res.error || "فشل إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ ما، يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="تعيين كلمة مرور جديدة"
      subtitle="ادخل كلمة المرور الجديدة لحسابك"
    >
      {checkingSession ? (
        <div className="text-center py-12 text-gray-500 font-bold" dir="rtl">
          جاري التحقق من صلاحية الرابط...
        </div>
      ) : (
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

          {isValidSession && (
            <>
              {/* New Password */}
              <PasswordInput
                label="كلمة المرور الجديدة"
                placeholder="أدخل كلمة المرور الجديدة"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Confirm Password */}
              <PasswordInput
                label="تأكيد كلمة المرور الجديدة"
                placeholder="أدخل تأكيد كلمة المرور"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {/* Submit */}
              <AuthButton type="submit" disabled={loading}>
                {loading ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
              </AuthButton>
            </>
          )}

          {/* Go to login */}
          {!isValidSession && (
            <div className="pt-4 text-center">
              <Link
                href="/forgot-password"
                className="font-bold text-[#7D79F1] hover:text-[#655EF0]"
              >
                طلب رابط جديد لإعادة التعيين
              </Link>
            </div>
          )}
        </form>
      )}
    </AuthLayout>
  );
}
