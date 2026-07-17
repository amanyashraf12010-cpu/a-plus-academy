"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";

export default function AuthButtons() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">

      <div className="transition duration-300 hover:-translate-y-1">
        <Button
          onClick={() => router.push("/login")}
          className="bg-transparent border border-[#7D79F1] !text-[#7D79F1] hover:bg-[#7D79F1] hover:!text-white transition"
        >
          سجل دخولك
        </Button>
      </div>


      <div className="transition duration-300 hover:-translate-y-1">
        <Button
          onClick={() => router.push("/register")}
          className="bg-[#7D79F1] text-white border border-[#7D79F1] hover:opacity-90"
        >
          اعمل حساب
        </Button>
      </div>

    </div>
  );
}