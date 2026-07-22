"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getLessonVideoUrl, getVideoProgress } from "@/lib/student";
import { 
  Play, 
  BookOpen, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  AlertTriangle, 
  Loader2, 
  ArrowRight,
  Eye
} from "lucide-react";
import Link from "next/link";

export default function LearnPage() {
  const params = useParams<any>();
  const courseId = params?.id || params?.Id; // Safe check for both lowercase and uppercase param keys
  const router = useRouter();
  const supabase = createClient();

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [viewsCount, setViewsCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("description");

  // Load Course and Lessons List
  async function loadCourseDetails() {
    if (!courseId) {
      console.warn("تعذر بدء التحميل: معرف الكورس غير متوفر.");
      return;
    }
    
    try {
      setLoading(true);
      console.log("جاري جلب تفاصيل الكورس للمعرف:", courseId);
      
      // 1. Get Course details
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*, teachers(name)")
        .eq("id", courseId)
        .single();

      if (courseError) {
        console.error("خطأ في جلب بيانات الكورس:", courseError.message);
        alert("الكورس غير موجود أو غير مصرح بالوصول إليه.");
        router.push("/my-courses");
        return;
      }
      setCourse(courseData);

      // 2. Get Lessons List
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order", { ascending: true });

      if (lessonsError) {
        console.error("خطأ في جلب دروس الكورس:", lessonsError.message);
        throw lessonsError;
      }

      setLessons(lessonsData || []);
      
      // Select first lesson by default
      if (lessonsData && lessonsData.length > 0) {
        setActiveLesson(lessonsData[0]);
      }
    } catch (error: any) {
      console.error("فشل تحميل تفاصيل محتوى الكورس:", error.message || error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (courseId) {
      loadCourseDetails();
    } else {
      console.warn("لم يتم الكشف عن courseId بعد في useParams.", params);
    }
  }, [courseId]);

  // Load Video URL and View Counts when activeLesson changes
  async function loadVideo(lesson: any) {
    if (!lesson) return;
    try {
      setLoadingVideo(true);
      setVideoError(null);
      setVideoUrl(null);

      // 1. Fetch secure video link (triggers DB view increment)
      const url = await getLessonVideoUrl(lesson.id);
      setVideoUrl(url);

      // 2. Fetch views count
      const views = await getVideoProgress(lesson.id);
      setViewsCount(views || 1); // fallback to 1 as it gets incremented on load
    } catch (error: any) {
      console.error("فشل تحميل الفيديو:", error.message || error);
      setVideoError(error.message || "فشل تحميل الفيديو، يرجى المحاولة لاحقاً.");
    } finally {
      setLoadingVideo(false);
    }
  }

  useEffect(() => {
    if (activeLesson) {
      loadVideo(activeLesson);
    }
  }, [activeLesson]);

  // Helper to extract YouTube/Vimeo Embed links
  function getEmbedUrl(url: string) {
    if (!url) return null;
    
    // YouTube RegExp
    const ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytReg);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
    }

    // Vimeo RegExp
    const vimeoReg = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
    const vimeoMatch = url.match(vimeoReg);
    if (vimeoMatch && vimeoMatch[3]) {
      return `https://player.vimeo.com/video/${vimeoMatch[3]}`;
    }

    return null;
  }

  // Navigation handlers
  function handleNextLesson() {
    const currentIndex = lessons.findIndex((l) => l.id === activeLesson.id);
    if (currentIndex < lessons.length - 1) {
      setActiveLesson(lessons[currentIndex + 1]);
    }
  }

  // Prev navigation
  function handlePrevLesson() {
    const currentIndex = lessons.findIndex((l) => l.id === activeLesson.id);
    if (currentIndex > 0) {
      setActiveLesson(lessons[currentIndex - 1]);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]" dir="rtl">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-[#7D79F1] mx-auto" size={40} />
          <p className="text-[#2D2B7A] font-bold text-lg">جاري تحميل محتوى الدرس والملفات...</p>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;
  const isFirstLesson = lessons.findIndex((l) => l.id === activeLesson?.id) === 0;
  const isLastLesson = lessons.findIndex((l) => l.id === activeLesson?.id) === lessons.length - 1;

  return (
    <div className="min-h-screen bg-[#F8F9FD]" dir="rtl">
      
      {/* Top Banner / Course Header */}
      <div className="bg-white border-b px-6 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/my-courses" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#7D79F1] font-bold mb-2">
              <ArrowRight size={14} />
              العودة لكورساتي
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D2B7A]">
              {course.title}
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">
              👨‍🏫 المدرس: {course.teachers?.name || "مدرس الأكاديمية"}
            </p>
          </div>
          <div className="bg-[#F3F2FF] px-5 py-3 rounded-2xl border border-[#E8E5FF] flex items-center gap-3">
            <BookOpen className="text-[#7D79F1]" size={20} />
            <div>
              <p className="text-xs text-gray-500">الدرس المفتوح حالياً</p>
              <h4 className="font-bold text-sm text-[#2D2B7A]">{activeLesson?.title || "لا يوجد دروس بعد"}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {lessons.length === 0 ? (
          <div className="bg-white rounded-3xl border shadow-sm p-12 text-center">
            <p className="text-gray-400 text-lg">لم يتم إضافة دروس لهذا الكورس بعد من قبل الإدارة.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left side: Video Player & Tabs */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Video Box */}
              <div className="bg-black rounded-3xl overflow-hidden shadow-lg aspect-video relative flex items-center justify-center border border-gray-800">
                {loadingVideo ? (
                  <div className="text-center text-white space-y-3">
                    <Loader2 className="animate-spin text-[#7D79F1] mx-auto" size={48} />
                    <p className="text-sm font-semibold">جاري تحضير عرض الفيديو الآمن...</p>
                  </div>
                ) : videoError ? (
                  <div className="p-6 text-center text-white max-w-md space-y-3">
                    <AlertTriangle className="text-red-500 mx-auto" size={48} />
                    <h3 className="text-lg font-bold text-red-400">تنبيه حماية المحتوى</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{videoError}</p>
                    <button 
                      onClick={() => loadVideo(activeLesson)}
                      className="mt-2 text-xs bg-[#7D79F1] text-white px-4 py-2 rounded-xl cursor-pointer"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                ) : videoUrl ? (
                  embedUrl ? (
                    // Iframe player for YouTube or Vimeo
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    // Secure HTML5 Video Player
                    <video
                      src={videoUrl}
                      controls
                      controlsList="nodownload"
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="text-center text-white">
                    <Lock size={48} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">حدد درساً لبدء مشاهدة الشرح</p>
                  </div>
                )}
              </div>

              {/* View Limits Info Bar */}
              {activeLesson && !videoError && !loadingVideo && (
                <div className="bg-white px-6 py-3.5 rounded-2xl border shadow-sm flex items-center justify-between text-xs md:text-sm font-semibold">
                  <div className="flex items-center gap-2 text-[#2D2B7A]">
                    <Eye size={18} className="text-[#7D79F1]" />
                    <span>عدد مشاهداتك لهذا الدرس:</span>
                  </div>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                    {viewsCount} / 3 مشاهدات مسموحة
                  </span>
                </div>
              )}

              {/* Lesson Nav Navigation */}
              <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border shadow-sm">
                <button
                  onClick={handlePrevLesson}
                  disabled={isFirstLesson}
                  className="flex items-center gap-1 text-[#7D79F1] disabled:text-gray-300 font-bold text-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                  الدرس السابق
                </button>
                <button
                  onClick={handleNextLesson}
                  disabled={isLastLesson}
                  className="flex items-center gap-1 text-[#7D79F1] disabled:text-gray-300 font-bold text-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  الدرس التالي
                  <ChevronLeft size={18} />
                </button>
              </div>

              {/* Tabs Section */}
              <div className="bg-white rounded-3xl border shadow-sm">
                <div className="flex border-b">
                  <button
                    onClick={() => setActiveTab("description")}
                    className={`flex-1 py-4 font-bold transition text-sm ${
                      activeTab === "description"
                        ? "text-[#7D79F1] border-b-2 border-[#7D79F1]"
                        : "text-gray-400"
                    }`}
                  >
                    وصف الدرس
                  </button>
                  <button
                    onClick={() => setActiveTab("files")}
                    className={`flex-1 py-4 font-bold transition text-sm ${
                      activeTab === "files"
                        ? "text-[#7D79F1] border-b-2 border-[#7D79F1]"
                        : "text-gray-400"
                    }`}
                  >
                    المرفقات والملخصات
                  </button>
                </div>

                <div className="p-6">
                  {activeTab === "description" && (
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-[#2D2B7A]">عن هذا الدرس</h3>
                      <p className="text-gray-600 leading-relaxed text-sm">
                        {activeLesson?.description || "لا يوجد وصف تفصيلي متوفر حالياً لهذا الدرس."}
                      </p>
                    </div>
                  )}

                  {activeTab === "files" && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-lg text-[#2D2B7A]">ملفات الدرس المرفقة</h3>
                      {activeLesson?.pdf_url ? (
                        <div className="border border-gray-100 bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="text-red-500" size={20} />
                            <span className="text-sm font-bold text-[#2D2B7A]">ملخص ومذكرة الشرح.pdf</span>
                          </div>
                          <a
                            href={activeLesson.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#7D79F1] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#655EF0] transition"
                          >
                            تحميل الملف
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">لا توجد ملفات PDF مرفقة بهذا الدرس.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right side: Sidebar (Lessons Index) */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border shadow-sm p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-extrabold text-[#2D2B7A]">فهرس الدروس</h2>
                  <p className="text-gray-400 text-xs mt-1 font-bold">يحتوي الكورس على {lessons.length} دروس</p>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {lessons.map((lesson, idx) => {
                    const isActive = lesson.id === activeLesson?.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full text-right p-4 rounded-2xl border transition flex items-center justify-between gap-3 text-sm cursor-pointer ${
                          isActive
                            ? "border-[#7D79F1] bg-[#F3F2FF] font-bold text-[#7D79F1]"
                            : "border-gray-100 hover:border-gray-200 text-gray-700 bg-white"
                        }`}
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-[#2D2B7A]">{idx + 1}. {lesson.title}</h4>
                          <p className="text-gray-400 text-xs mt-1">{lesson.duration || "غير محدد المدة"}</p>
                        </div>
                        <Play size={16} className={isActive ? "text-[#7D79F1]" : "text-gray-300"} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}