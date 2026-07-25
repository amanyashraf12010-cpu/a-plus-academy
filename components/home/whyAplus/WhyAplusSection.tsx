"use client";

import Container from "@/components/shared/Container";
import { motion } from "framer-motion";

const features = [
  {
    title: "أفضل المدرسين",
    desc: "اتعلم مع نخبة من المدرسين أصحاب الخبرة والنتائج.",
    emoji: "📚",
  },
  {
    title: "شرح بجودة عالية",
    desc: "فيديوهات واضحة تقدر ترجع لها في أي وقت.",
    emoji: "🎥",
  },
  {
    title: "تعلم من أي مكان",
    desc: "من الموبايل أو اللاب في أي وقت يناسبك.",
    emoji: "📱",
  },
  {
    title: "متابعة مستمرة",
    desc: "ذاكر خطوة بخطوة لحد ما تحقق هدفك.",
    emoji: "📈",
  },
];

export default function WhyAplusSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-[#F9F8FF]">
      <Container>

        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#02343F]">
            ليه تختار{" "}
            <span className="text-[#7D79F1] drop-shadow-[0_0_10px_rgba(125,121,241,0.2)]">
              +A
            </span>
            ؟
          </h2>
          <p className="text-gray-500 mt-4 text-lg">
            منصتنا تقدم لك كل ما تحتاجه للنجاح والتفوق الدراسي
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="
                flex items-start gap-4 p-6
                bg-white rounded-3xl
                shadow-sm border border-gray-100
                transition-all duration-300 ease-out
                hover:-translate-y-2
                hover:shadow-xl
                hover:border-[#7D79F1]/30
                cursor-pointer
              "
            >
              {/* Emoji Icon Container */}
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl bg-[#7D79F1]/10 text-3xl shadow-sm">
                {feat.emoji}
              </div>

              {/* Content */}
              <div className="space-y-1">
                <h3 className="font-bold text-xl text-[#02343F] hover:text-[#7D79F1] transition-colors">
                  {feat.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </Container>
    </section>
  );
}