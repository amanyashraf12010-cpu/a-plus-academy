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
  Eye,
  CheckCircle,
  XCircle,
  Award,
  Clock
} from "lucide-react";
import Link from "next/link";
import { getCourseProgressAndLocks } from "@/lib/quizzes";

export default function LearnPage() {
  const params = useParams<any>();
  const courseId = params?.id || params?.Id; // Safe check for both lowercase and uppercase param keys
  const router = useRouter();
  const supabase = createClient();

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [progressInfo, setProgressInfo] = useState<any>(null);
  
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

      // 2. Fetch user session and calculate progress/locks
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const progressData = await getCourseProgressAndLocks(session.user.id, courseId);
        setProgressInfo(progressData);
        setLessons(progressData.lessons || []);
        
        // Select active lesson
        if (progressData.lessons && progressData.lessons.length > 0) {
          // Select first unlocked lesson or first lesson
          const firstUnlocked = progressData.lessons.find((l: any) => !l.isLocked) || progressData.lessons[0];
          setActiveLesson(firstUnlocked);
        }
      } else {
        // Fallback for non-authenticated (should not happen due to routing guards)
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("lessons")
          .select("*")
          .eq("course_id", courseId)
          .order("order", { ascending: true });

        if (lessonsError) throw lessonsError;

        const mappedLessons = (lessonsData || []).map((l: any) => ({ ...l, isLocked: false }));
        setLessons(mappedLessons);
        if (mappedLessons.length > 0) {
          setActiveLesson(mappedLessons[0]);
        }
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
    if (lesson.isLocked) {
      setVideoError("⚠️ هذه المحاضرة مغلقة حالياً. يجب اجتياز واجب المحاضرة السابقة أولاً بنسبة نجاح 50% أو أكثر لتتمكن من مشاهدة الفيديو.");
      return;
    }
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
                  <button
                    onClick={() => setActiveTab("quiz")}
                    className={`flex-1 py-4 font-bold transition text-sm ${
                      activeTab === "quiz"
                        ? "text-[#7D79F1] border-b-2 border-[#7D79F1]"
                        : "text-gray-400"
                    }`}
                  >
                    الواجب المنزلي
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

                  {activeTab === "quiz" && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg text-[#2D2B7A]">واجب الدرس: {activeLesson?.title}</h3>
                      {activeLesson?.quizId ? (
                        <div className="border border-gray-100 bg-gray-50 rounded-2xl p-5 space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                            <div>
                              <p className="text-sm font-bold text-[#2D2B7A]">واجب المحاضرة الإلكتروني</p>
                              <p className="text-xs text-gray-500 mt-1">درجة النجاح المطلوبة: {activeLesson.passingScore}% أو أكثر</p>
                            </div>
                            
                            <div>
                              {activeLesson.quizStatus === "passed" && (
                                <span className="bg-green-50 text-green-600 border border-green-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                                  <CheckCircle size={14} />
                                  تم الاجتياز بنجاح ({activeLesson.highestScore}%)
                                </span>
                              )}
                              {activeLesson.quizStatus === "failed" && (
                                <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                                  <XCircle size={14} />
                                  لم يتم الاجتياز ({activeLesson.highestScore}%)
                                </span>
                              )}
                              {activeLesson.quizStatus === "not_started" && (
                                <span className="bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                                  لم يتم البدء بعد
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="text-xs text-gray-500 space-y-1">
                              <p>عدد محاولاتك الحالية: <span className="font-bold text-[#2D2B7A]">{activeLesson.quizAttemptsCount}</span></p>
                              {activeLesson.highestScore !== null && (
                                <p>أعلى نسبة محققة: <span className="font-bold text-[#7D79F1]">{activeLesson.highestScore}%</span></p>
                              )}
                            </div>

                            <Link
                              href={`/learn/${courseId}/quiz/${activeLesson.quizId}`}
                              className="bg-[#7D79F1] text-white text-center px-6 py-3 rounded-xl text-xs font-bold hover:bg-[#655EF0] transition shadow-sm hover:shadow flex items-center justify-center gap-1.5"
                            >
                              <Award size={15} />
                              {activeLesson.quizStatus === "passed"
                                ? "إعادة حل الواجب للتمرّن"
                                : activeLesson.quizAttemptsCount > 0
                                ? "أعد المحاولة لتحقيق النجاح"
                                : "بدء حل الواجب الآن"}
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">لا يوجد واجب إلكتروني مضاف لهذه المحاضرة بعد.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right side: Sidebar (Lessons Index & Final Exam) */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border shadow-sm p-6">
                
                {/* Course Progress */}
                {progressInfo && (
                  <div className="mb-6 pb-4 border-b">
                    <div className="flex justify-between items-center text-xs font-bold mb-2">
                      <span className="text-[#2D2B7A]">نسبة إكمال الكورس</span>
                      <span className="text-[#7D79F1]">{progressInfo.courseProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#7D79F1] to-[#655EF0] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progressInfo.courseProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-lg font-extrabold text-[#2D2B7A]">فهرس الدروس</h2>
                  <p className="text-gray-400 text-xs mt-1 font-bold">يحتوي الكورس على {lessons.length} دروس</p>
                </div>

                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {lessons.map((lesson, idx) => {
                    const isActive = lesson.id === activeLesson?.id;
                    const isLocked = lesson.isLocked;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          if (isLocked) {
                            alert("⚠️ عذراً، هذه المحاضرة مغلقة! يرجى اجتياز واجب المحاضرة السابقة أولاً بنسبة نجاح 50% أو أكثر لتفتح لك هذه المحاضرة.");
                            return;
                          }
                          setActiveLesson(lesson);
                        }}
                        className={`w-full text-right p-4 rounded-2xl border transition flex items-center justify-between gap-3 text-sm cursor-pointer ${
                          isActive
                            ? "border-[#7D79F1] bg-[#F3F2FF] font-bold text-[#7D79F1]"
                            : isLocked
                            ? "border-gray-100 bg-gray-50/50 text-gray-400 cursor-not-allowed"
                            : "border-gray-100 hover:border-gray-200 text-gray-700 bg-white"
                        }`}
                      >
                        <div className="flex-1">
                          <h4 className={`font-bold ${isLocked ? "text-gray-400" : "text-[#2D2B7A]"}`}>
                            {idx + 1}. {lesson.title}
                          </h4>
                          <p className="text-gray-400 text-xs mt-1 flex items-center gap-1.5">
                            <span>{lesson.duration || "غير محدد المدة"}</span>
                            {lesson.quizId && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                lesson.quizStatus === "passed"
                                  ? "bg-green-50 text-green-600 border-green-150"
                                  : lesson.quizStatus === "failed"
                                  ? "bg-red-50 text-red-600 border-red-150"
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              }`}>
                                {lesson.quizStatus === "passed" ? "تم حل الواجب" : lesson.quizStatus === "failed" ? "لم تجتز الواجب" : "له واجب"}
                              </span>
                            )}
                          </p>
                        </div>
                        {isLocked ? (
                          <Lock size={16} className="text-gray-300" />
                        ) : (
                          <Play size={16} className={isActive ? "text-[#7D79F1]" : "text-gray-300"} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Final Exam Section */}
                {progressInfo?.finalExam && (
                  <div className="mt-6 border-t pt-6">
                    <div className={`p-5 rounded-2xl border transition ${
                      progressInfo.finalExamUnlocked 
                        ? "bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-[#E8E5FF]" 
                        : "bg-gray-50 border-gray-150 opacity-75"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-extrabold text-[#2D2B7A] text-sm flex items-center gap-1.5">
                          🏆 الامتحان الشامل النهائي
                        </h3>
                        {!progressInfo.finalExamUnlocked && (
                          <Lock size={16} className="text-gray-400" />
                        )}
                      </div>

                      <p className="text-xs text-gray-500 leading-relaxed mb-4">
                        {progressInfo.finalExamUnlocked 
                          ? "تهانينا! لقد أنهيت جميع محاضرات الكورس، يمكنك الآن البدء في الامتحان النهائي لقياس مستواك والحصول على شهادتك."
                          : "يفتح هذا الامتحان الشامل تلقائياً بعد مشاهدة جميع المحاضرات واجتياز كل الواجبات المنزلية بنسبة 50% فأكثر."}
                      </p>

                      {progressInfo.finalExam.status === "submitted" ? (
                        <div className="bg-white p-3.5 rounded-xl border border-gray-100 mb-4 text-xs font-semibold text-[#2D2B7A] space-y-2 shadow-sm">
                          <div className="flex justify-between">
                            <span>حالة تسليم الامتحان:</span>
                            <span className="text-green-600">تم التسليم بنجاح</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span>درجة الامتحان:</span>
                            <span className="text-[#7D79F1] font-bold text-sm">{progressInfo.finalExam.score}%</span>
                          </div>
                        </div>
                      ) : progressInfo.finalExam.startTime && new Date(progressInfo.finalExam.startTime) > new Date() ? (
                        <div className="bg-amber-50 text-amber-850 p-3 rounded-xl border border-amber-100 text-xs font-semibold mb-4 text-center">
                          الامتحان سيبدأ في: {new Date(progressInfo.finalExam.startTime).toLocaleString("ar-EG")}
                        </div>
                      ) : progressInfo.finalExam.endTime && new Date(progressInfo.finalExam.endTime) < new Date() ? (
                        <div className="bg-red-50 text-red-850 p-3 rounded-xl border border-red-100 text-xs font-semibold mb-4 text-center">
                          انتهى موعد الامتحان في: {new Date(progressInfo.finalExam.endTime).toLocaleString("ar-EG")}
                        </div>
                      ) : null}

                      {progressInfo.finalExamUnlocked && (
                        <div className="space-y-2">
                          {progressInfo.finalExam.status !== "submitted" && (
                            <Link
                              href={`/learn/${courseId}/quiz/${progressInfo.finalExam.id}`}
                              className="w-full bg-[#7D79F1] hover:bg-[#655EF0] text-white text-center py-3 rounded-xl text-xs font-bold block transition shadow-sm"
                            >
                              بدء الامتحان النهائي الشامل
                            </Link>
                          )}
                          {progressInfo.finalExam.status === "submitted" && (
                            <Link
                              href={`/learn/${courseId}/quiz/${progressInfo.finalExam.id}`}
                              className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-[#7D79F1] text-center py-3 rounded-xl text-xs font-bold block transition shadow-sm"
                            >
                              مراجعة الامتحان التفصيلية
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}