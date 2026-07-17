import { PlayCircle } from "lucide-react";

export default function VideoPlayer() {
  return (
    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">

      <div className="aspect-video bg-gradient-to-br from-[#2D2B7A] to-[#7D79F1] flex flex-col items-center justify-center">

        <PlayCircle
          size={90}
          className="text-white"
        />

      </div>

      <div className="p-6">

        <h2 className="text-2xl font-bold text-[#2D2B7A]">
          الدرس الحالي
        </h2>

        <p className="text-gray-500 mt-2">
          سيتم تشغيل الفيديو هنا بعد ربط الباك إند.
        </p>

      </div>

    </div>
  );
}