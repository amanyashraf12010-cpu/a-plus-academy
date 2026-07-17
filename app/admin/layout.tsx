import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  CreditCard,
  LogOut,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#F5F7FB]">

      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r shadow-sm flex flex-col">

        {/* Logo */}
        <div className="p-8 border-b">

          <h1 className="text-3xl font-bold text-[#2D2B7A] text-center">
            A Plus
          </h1>

          <p className="text-center text-sm text-gray-500 mt-2">
            Admin Dashboard
          </p>

        </div>

        {/* Menu */}
        <nav className="flex-1 p-5 space-y-2">

          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#2D2B7A] hover:bg-[#F3F2FF] hover:text-[#7D79F1] transition font-semibold"
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>

          <Link
            href="/admin/courses"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#2D2B7A] hover:bg-[#F3F2FF] hover:text-[#7D79F1] transition font-semibold"
          >
            <BookOpen size={20} />
            Courses
          </Link>

          <Link
            href="/admin/teachers"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#2D2B7A] hover:bg-[#F3F2FF] hover:text-[#7D79F1] transition font-semibold"
          >
            <GraduationCap size={20} />
            Teachers
          </Link>

          <Link
            href="/admin/students"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#2D2B7A] hover:bg-[#F3F2FF] hover:text-[#7D79F1] transition font-semibold"
          >
            <Users size={20} />
            Students
          </Link>

          <Link
            href="/admin/payments"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#2D2B7A] hover:bg-[#F3F2FF] hover:text-[#7D79F1] transition font-semibold"
          >
            <CreditCard size={20} />
            Payments
          </Link>

        </nav>

        {/* Logout */}
        <div className="p-5 border-t">

          <button className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl hover:bg-red-100 transition">

            <LogOut size={18} />

            Logout

          </button>

        </div>

      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">

        {children}

      </main>

    </div>
  );
}