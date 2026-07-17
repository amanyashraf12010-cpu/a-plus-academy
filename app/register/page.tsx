import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="إنشاء حساب جديد"
      subtitle="ابدأ رحلتك التعليمية مع A Plus Academy"
    >
      <RegisterForm />
    </AuthLayout>
  );
}