import Container from "@/components/shared/Container";
import Link from "next/link";
import { FaFacebook, FaInstagram, FaYoutube, FaTelegram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#0B0B1A] text-white pt-20 mt-24">

      <Container>

        {/* MAIN GRID */}
        <div className="flex flex-col items-center text-center gap-12">

          {/* BRAND */}
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold text-[#7D79F1]">
              A Plus Academy
            </h2>

            <p className="text-gray-400 mt-4 leading-7">
              منصة تعليمية تساعدك توصل لأعلى الدرجات من خلال أفضل المدرسين
              والكورسات والاختبارات الذكية.
            </p>
          </div>

          {/* SOCIAL */}
          <div>
            <h3 className="font-bold mb-4">تابعنا</h3>

            <div className="flex gap-4 justify-center">

              <a className="p-3 rounded-xl bg-white/10 hover:bg-[#7D79F1] transition">
                <FaTelegram size={18} />
              </a>

              <a className="p-3 rounded-xl bg-white/10 hover:bg-[#7D79F1] transition">
                <FaYoutube size={18} />
              </a>

              <a className="p-3 rounded-xl bg-white/10 hover:bg-[#7D79F1] transition">
                <FaInstagram size={18} />
              </a>

              <a className="p-3 rounded-xl bg-white/10 hover:bg-[#7D79F1] transition">
                <FaFacebook size={18} />
              </a>

            </div>

            <p className="text-gray-500 mt-6 text-sm">
              اشترك في التحديثات الجديدة
            </p>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-white/10 mt-16 py-6 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} A Plus Academy. All rights reserved.
        </div>

      </Container>
    </footer>
  );
}