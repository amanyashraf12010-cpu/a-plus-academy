"use client";

import { usePathname, useRouter } from "next/navigation";

export default function NavLinks() {
  const pathname = usePathname();
  const router = useRouter();

  const goToSection = (id: string) => {
    if (pathname !== "/") {
      router.push(`/#${id}`);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const linkClass =
    "relative cursor-pointer text-[#2D2B7A] font-semibold text-xl transition hover:text-[#7D79F1] group";

  const underline =
    "absolute left-1/2 -bottom-1 h-[2px] w-0 bg-[#7D79F1] transition-all duration-300 group-hover:w-full group-hover:left-0";

  return (
    <div className="flex items-center gap-14">

      <span
        className={linkClass}
        onClick={() => router.push("/")}
      >
        الرئيسية
        <span className={underline}></span>
      </span>

      <span
        className={linkClass}
        onClick={() => goToSection("courses")}
      >
        كورستنا
        <span className={underline}></span>
      </span>

      <span
        className={linkClass}
        onClick={() => goToSection("teachers")}
      >
        المدرسين
        <span className={underline}></span>
      </span>

      <span
        className={linkClass}
        onClick={() => goToSection("contact")}
      >
        اتواصل معانا
        <span className={underline}></span>
      </span>

    </div>
  );
}