import Button from "@/components/shared/Button";

export default function HeroContent() {
  return (
    <div className="flex-1 text-right">
      
      <h1 className="text-4xl md:text-5xl font-bold text-[#02343F] leading-tight">
        ابدأ رحلتك التعليمية مع A Plus Academy
      </h1>

      <p className="mt-5 text-gray-600 text-lg">
        تعلم مع أفضل المدرسين في مكان واحد وابدأ طريق النجاح بخطوات بسيطة.
      </p>

      <div className="mt-8 flex gap-4 justify-end">
        <Button>
          ابدأ الآن
        </Button>

        <Button variant="outline">
          تصفح الكورسات
        </Button>
      </div>

    </div>
  );
}