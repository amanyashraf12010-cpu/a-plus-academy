import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      title="تسجيل الدخول"
      subtitle="ادخل بياناتك للوصول إلى حسابك"
    >
      <LoginForm />
    </AuthLayout>
  );
}