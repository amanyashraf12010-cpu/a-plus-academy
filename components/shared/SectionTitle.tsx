import { ReactNode } from "react";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export default function SectionTitle({
  title,
  subtitle,
  align = "center",
}: SectionTitleProps) {
  return (
    <div
      className={`mb-10 ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      <h2 className="text-3xl md:text-4xl font-bold text-[#02343F]">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-3 text-gray-600 text-base md:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}