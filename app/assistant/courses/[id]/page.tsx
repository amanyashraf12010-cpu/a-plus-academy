"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAssistantCourseDetails } from "@/lib/assistant";
import { 
  ArrowRight, 
  BookOpen, 
  Video, 
  CheckCircle2, 
  XCircle, 
  Play, 
  X, 
  Loader2, 
  Layers, 
  GraduationCap,
  ExternalLink
} from "lucide-react";

function CourseDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Video Preview Modal State
  const [previewLesson, setPreviewLesson] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      if (!courseId) return;
      try {
        setLoading(true);
        setErrorMsg("");
        const data = await getAssistantCourseDetails(courseId);
        setCourse(data.course);
        setLessons(data.lessons || []);
      } catch (err: any) {
        console.error("فشل تحميل تفاصيل الكورس:", err.message);
        setErrorMsg(err.message || "حدث خطأ أثناء تحميل تفاصيل الكورس.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  // Helper to format embed video URL (YouTube, Vimeo, or Direct)
  function getEmbedUrl(url: string) {
    if (!url) return null;
    const trimmed = url.trim();

    // YouTube
    const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }

    // Vimeo
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    return trimmed;
  }

  const isDirectVideo = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".ogg") || lower.includes("storage.googleapis.com") || lower.includes("supabase.co/storage");
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7D79F1]" size={36} />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="space-y-6 max-w-4xl" dir="rtl">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-center space-y-4">
          <p className="font-bold">{errorMsg}</p>
          <Link
            href="/assistant/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7D79F1] text-white rounded-xl font-bold text-xs"
          >
            <ArrowRight size={14} />
            العودة لقائمة الكورسات
          </Link>
        </div>
      </div>
    );
  }

  const uploadedVideosCount = lessons.filter((l) => l.hasVideo).length;

  return (
    <div className="space-y-8 max-w-6xl" dir="rtl">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/assistant/courses"
            className="p-3 bg-white border hover:bg-gray-50 rounded-2xl transition text-gray-500 shadow-sm"
            title="رجوع لقائمة الكورسات"
          >
            <ArrowRight size={20} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D2B7A]">
              محاضرات الكورس
            </h1>
            <p className="text-gray-500 mt-0.5 text-xs md:text-sm font-semibold">
              الكورس: <span className="text-[#7D79F1] font-bold">{course?.title}</span>
            </p>
          </div>
        </div>

        <Link
          href="/assistant/courses"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition"
        >
          رجوع
        </Link>
      </div>

      {/* Course Info Summary Card */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={course?.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600"}
            alt={course?.title}
            className="w-20 h-20 rounded-2xl object-cover border shrink-0"
          />
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#2D2B7A]">{course?.title}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500 font-semibold flex-wrap">
              {course?.grade && <span className="bg-gray-100 px-2.5 py-0.5 rounded-lg">{course.grade}</span>}
              {course?.subject && <span className="bg-purple-50 text-[#7D79F1] px-2.5 py-0.5 rounded-lg font-bold">{course.subject}</span>}
              {course?.teachers?.name && (
                <span className="text-gray-600 font-bold">المدرس: {course.teachers.name}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="bg-purple-50 text-[#7D79F1] px-4 py-2.5 rounded-2xl border border-purple-100 font-extrabold text-xs">
            إجمالي المحاضرات: {lessons.length}
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-2xl border border-emerald-100 font-extrabold text-xs">
            الفيديوهات المرفوعة: {uploadedVideosCount}
          </div>
        </div>
      </div>

      {/* Lectures List */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden divide-y">
        <div className="p-5 bg-[#F8F9FD] border-b flex items-center justify-between">
          <h3 className="font-extrabold text-[#2D2B7A] text-base flex items-center gap-2">
            <Layers className="text-[#7D79F1]" size={18} />
            قائمة محاضرات الكورس
          </h3>
          <span className="text-xs text-gray-400 font-bold">
            يمكنك الضغط على زر مشاهدة الفيديو لمعاينة المحتوى والتأكد من صحته
          </span>
        </div>

        {lessons.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">
            لم تتم إضافة أي محاضرات في هذا الكورس بعد.
          </div>
        ) : (
          lessons.map((lesson, idx) => {
            const hasVideo = lesson.hasVideo;

            return (
              <div
                key={lesson.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F3F2FF]/20 transition"
              >
                {/* Lecture Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#F3F2FF] text-[#7D79F1] font-black text-sm flex items-center justify-center shrink-0 border border-purple-100">
                    {lesson.order || idx + 1}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <h4 className="font-extrabold text-[#2D2B7A] text-base">
                      {lesson.title}
                    </h4>
                    
                    {/* Video Status Badge */}
                    <div>
                      {hasVideo ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-0.5 rounded-full text-xs font-bold border border-emerald-200">
                          <CheckCircle2 size={13} />
                          الفيديو موجود ✅
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-0.5 rounded-full text-xs font-bold border border-rose-200">
                          <XCircle size={13} />
                          الفيديو غير موجود ❌
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Video Action Button */}
                <div className="shrink-0 self-end md:self-center">
                  {hasVideo ? (
                    <button
                      onClick={() => setPreviewLesson(lesson)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
                    >
                      <Play size={14} className="fill-current" />
                      مشاهدة الفيديو
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 font-semibold bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 block text-center">
                      لا يوجد فيديو مرفوع
                    </span>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Video Preview Modal */}
      {previewLesson && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <Video className="text-[#7D79F1]" size={20} />
                <h3 className="font-extrabold text-[#2D2B7A] text-base">
                  معاينة الفيديو: {previewLesson.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewLesson(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Video Player */}
            <div className="p-6 bg-gray-900 flex-1 flex items-center justify-center min-h-[350px]">
              {isDirectVideo(previewLesson.video_url) ? (
                <video
                  controls
                  autoPlay
                  src={previewLesson.video_url}
                  className="w-full h-auto max-h-[60vh] rounded-2xl shadow-lg bg-black"
                >
                  متصفحك لا يدعم تشغيل هذا الفيديو.
                </video>
              ) : (
                <iframe
                  src={getEmbedUrl(previewLesson.video_url) || previewLesson.video_url}
                  title={previewLesson.title}
                  className="w-full aspect-video rounded-2xl shadow-lg bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium truncate max-w-md dir-ltr text-right">
                {previewLesson.video_url}
              </span>
              <button
                onClick={() => setPreviewLesson(null)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function AssistantCourseDetailsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500 font-bold">جاري تحميل تفاصيل الكورس والمحاضرات...</div>}>
      <CourseDetailsContent />
    </Suspense>
  );
}
