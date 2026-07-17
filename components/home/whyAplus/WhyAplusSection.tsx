"use client";

import Container from "@/components/shared/Container";
import { motion } from "framer-motion";
import {
  BookOpen,
  PencilRuler,
  ClipboardCheck,
  Trophy,
} from "lucide-react";

const steps = [
  {
    title: "افهم الدرس",
    desc: "شرح مبسط وسهل لأي مستوى",
    icon: BookOpen,
  },
  {
    title: "حل أسئلة",
    desc: "تدريب عملي على كل فكرة",
    icon: PencilRuler,
  },
  {
    title: "اختبر نفسك",
    desc: "امتحانات شبيهة بالواقع",
    icon: ClipboardCheck,
  },
  {
    title: "تتفوق وتجيب A+",
    desc: "تكون جاهز تحقق أعلى درجة",
    icon: Trophy,
  },
];

export default function WhyAplusSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-[#F9F8FF]">
      <Container>

        {/* Title */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#02343F]">
            إزاي هتجيب{" "}
            <span className="text-[#7D79F1] drop-shadow-[0_0_10px_#7D79F1]">
              A+
            </span>
            ؟
          </h2>

          <p className="text-gray-500 mt-4 text-lg">
            رحلة خطوة بخطوة لحد التفوق
          </p>
        </div>

        {/* Steps */}
        <div className="relative">

          {/* Line */}
          <div className="absolute left-1/2 top-0 h-full w-[2px] bg-[#7D79F1]/30 hidden md:block" />

          <div className="grid md:grid-cols-2 gap-10 relative z-10">

            {steps.map((step, i) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="
                    flex items-start gap-4 p-6
                    bg-white rounded-2xl
                    shadow-sm border border-gray-100
                    transition-all duration-300 ease-out
                    hover:-translate-y-3
                    hover:shadow-2xl
                    hover:border-[#7D79F1]/40
                    cursor-pointer
                  "
                >

                  {/* Icon */}
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#7D79F1] text-white shadow-lg">
                    <Icon size={22} />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="font-bold text-[#02343F]">
                      {step.title}
                    </h3>

                    <p className="text-gray-500 mt-1 text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                </motion.div>
              );
            })}
          </div>
        </div>

      </Container>
    </section>
  );
}