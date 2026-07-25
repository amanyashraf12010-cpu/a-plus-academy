import Container from "@/components/shared/Container";
import Link from "next/link";
import { FaFacebook, FaInstagram, FaYoutube, FaTiktok } from "react-icons/fa";

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

              <a
                href="https://www.tiktok.com/@aplus.edu?_r=1&_t=ZS-98KJugN2G4z"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/10 hover:bg-[#7D79F1] transition cursor-pointer"
                title="تيك توك"
              >
                <FaTiktok size={18} />
              </a>

              <a
                href="https://youtube.com/@a-aplus-edu?si=hezp-sFj6D6PHca2"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/10 hover:bg-[#7D79F1] transition cursor-pointer"
                title="يوتيوب"
              >
                <FaYoutube size={18} />
              </a>

              <a
                href="https://www.instagram.com/aplus.edu1?igsh=OGJtZXUxazk2cDlu"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/10 hover:bg-[#7D79F1] transition cursor-pointer"
                title="انستجرام"
              >
                <FaInstagram size={18} />
              </a>

              <a
                href="https://www.facebook.com/share/1CV9tUcGHN/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/10 hover:bg-[#7D79F1] transition cursor-pointer"
                title="فيسبوك"
              >
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