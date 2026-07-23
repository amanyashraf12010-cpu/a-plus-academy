import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <AuthLayout
      title="تسجيل الدخول"
      subtitle="ادخل بياناتك للوصول إلى حسابك"
    >
      <Suspense fallback={<div className="text-center py-4 text-gray-500 font-semibold">جاري التحميل...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}