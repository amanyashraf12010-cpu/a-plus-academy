"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  getAdminQuizzesForCourse, 
  saveQuiz, 
  saveQuestion, 
  deleteQuestion, 
  uploadQuizImage,
  getCourseStudentPerformance
} from "@/lib/admin-quizzes";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowRight, 
  X, 
  Image as ImageIcon, 
  Save, 
  Check, 
  GraduationCap, 
  ChevronLeft, 
  Loader2,
  FileText,
  Users
} from "lucide-react";
import Link from "next/link";

function ExamsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId"); // if provided, we are managing a lesson quiz

  const supabase = createClient();

  // Page level states
  const [courseTitle, setCourseTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "students">("questions");

  // Quiz Form states
  const [quizTitle, setQuizTitle] = useState("");
  const [passingScore, setPassingScore] = useState(50);
  const [duration, setDuration] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  // Questions List
  const [questions, setQuestions] = useState<any[]>([]);

  // Question Form / Modal states
  const [showQModal, setShowQModal] = useState(false);
  const [qModalMode, setQModalMode] = useState<"add" | "edit">("add");
  const [selectedQId, setSelectedQId] = useState<string | null>(null);
  const [qText, setQText] = useState("");
  const [qImageUrl, setQImageUrl] = useState("");
  const [qImageFile, setQImageFile] = useState<File | null>(null);
  const [correctOption, setCorrectOption] = useState<"A" | "B" | "C" | "D">("A");

  // Options states
  const [optAText, setOptAText] = useState("");
  const [optAImageUrl, setOptAImageUrl] = useState("");
  const [optAImageFile, setOptAImageFile] = useState<File | null>(null);

  const [optBText, setOptBText] = useState("");
  const [optBImageUrl, setOptBImageUrl] = useState("");
  const [optBImageFile, setOptBImageFile] = useState<File | null>(null);

  const [optCText, setOptCText] = useState("");
  const [optCImageUrl, setOptCImageUrl] = useState("");
  const [optCImageFile, setOptCImageFile] = useState<File | null>(null);

  const [optDText, setOptDText] = useState("");
  const [optDImageUrl, setOptDImageUrl] = useState("");
  const [optDImageFile, setOptDImageFile] = useState<File | null>(null);

  const [isSavingQ, setIsSavingQ] = useState(false);

  // Students performance report state
  const [studentPerformance, setStudentPerformance] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Load Course/Lesson details and Quiz metadata
  async function loadData() {
    if (!courseId) return;
    try {
      setLoading(true);
      
      // 1. Fetch Course details
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .single();
      if (courseError) throw courseError;
      setCourseTitle(course.title);

      // 2. Fetch Lesson title if lessonId exists
      if (lessonId) {
        const { data: lesson, error: lessonError } = await supabase
          .from("lessons")
          .select("title")
          .eq("id", lessonId)
          .single();
        if (lessonError) throw lessonError;
        setLessonTitle(lesson.title);
      }

      // 3. Fetch Quiz record
      let query = supabase.from("quizzes").select("*, questions(*, options(*))").eq("course_id", courseId);
      if (lessonId) {
        query = query.eq("lesson_id", lessonId);
      } else {
        query = query.eq("type", "final");
      }
      
      const { data: quizzes, error: quizError } = await query;
      if (quizError) throw quizError;

      if (quizzes && quizzes.length > 0) {
        const activeQuiz = quizzes[0];
        setQuiz(activeQuiz);
        setQuizTitle(activeQuiz.title);
        setPassingScore(activeQuiz.passing_score);
        setDuration(activeQuiz.duration ? String(activeQuiz.duration) : "");
        setStartTime(activeQuiz.start_time ? activeQuiz.start_time.substring(0, 16) : "");
        setEndTime(activeQuiz.end_time ? activeQuiz.end_time.substring(0, 16) : "");
        setIsActive(activeQuiz.is_active);

        // Sort questions by created_at
        const sortedQuestions = (activeQuiz.questions || []).sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setQuestions(sortedQuestions);
      } else {
        // No quiz found, set default title
        setQuiz(null);
        setQuizTitle(lessonId ? `واجب درس: ` : `الامتحان الشامل لكورس: `);
        setQuestions([]);
      }

    } catch (error) {
      console.error("فشل جلب تفاصيل التقييم:", error);
    } finally {
      setLoading(false);
    }
  }

  // Load students performance list
  async function loadStudentPerformance() {
    if (!courseId) return;
    try {
      setLoadingStudents(true);
      const perf = await getCourseStudentPerformance(courseId);
      setStudentPerformance(perf);
    } catch (error) {
      console.error("فشل تحميل أداء الطلاب:", error);
    } finally {
      setLoadingStudents(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [courseId, lessonId]);

  useEffect(() => {
    if (activeTab === "students") {
      loadStudentPerformance();
    }
  }, [activeTab]);

  // Save/Create Quiz Metadata
  async function handleSaveQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) return;

    try {
      setIsSavingQuiz(true);
      
      const payload = {
        id: quiz?.id,
        course_id: courseId,
        lesson_id: lessonId || null,
        title: quizTitle.trim(),
        type: (lessonId ? "quiz" : "final") as "quiz" | "final",
        passing_score: passingScore,
        duration: duration ? Number(duration) : null,
        start_time: startTime ? new Date(startTime).toISOString() : null,
        end_time: endTime ? new Date(endTime).toISOString() : null,
        is_active: isActive
      };

      const saved = await saveQuiz(payload);
      alert(quiz ? "تم تحديث إعدادات الامتحان بنجاح." : "تم إنشاء الامتحان بنجاح. يمكنك الآن إضافة أسئلة.");
      setQuiz(saved);
      loadData();
    } catch (error: any) {
      alert("فشل حفظ إعدادات التقييم: " + error.message);
    } finally {
      setIsSavingQuiz(false);
    }
  }

  // Open Q Modal in Add mode
  function openAddQModal() {
    setQModalMode("add");
    setSelectedQId(null);
    setQText("");
    setQImageUrl("");
    setQImageFile(null);
    setCorrectOption("A");
    
    setOptAText(""); setOptAImageUrl(""); setOptAImageFile(null);
    setOptBText(""); setOptBImageUrl(""); setOptBImageFile(null);
    setOptCText(""); setOptCImageUrl(""); setOptCImageFile(null);
    setOptDText(""); setOptDImageUrl(""); setOptDImageFile(null);
    
    setShowQModal(true);
  }

  // Open Q Modal in Edit mode
  function openEditQModal(q: any) {
    setQModalMode("edit");
    setSelectedQId(q.id);
    setQText(q.question_text || "");
    setQImageUrl(q.question_image || "");
    setQImageFile(null);
    setCorrectOption(q.correct_option);

    const optA = q.options?.find((o: any) => o.option_letter === "A");
    const optB = q.options?.find((o: any) => o.option_letter === "B");
    const optC = q.options?.find((o: any) => o.option_letter === "C");
    const optD = q.options?.find((o: any) => o.option_letter === "D");

    setOptAText(optA?.option_text || ""); setOptAImageUrl(optA?.option_image || ""); setOptAImageFile(null);
    setOptBText(optB?.option_text || ""); setOptBImageUrl(optB?.option_image || ""); setOptBImageFile(null);
    setOptCText(optC?.option_text || ""); setOptCImageUrl(optC?.option_image || ""); setOptCImageFile(null);
    setOptDText(optD?.option_text || ""); setOptDImageUrl(optD?.option_image || ""); setOptDImageFile(null);

    setShowQModal(true);
  }

  // Handle Question Submit (Save Question and Options)
  async function handleSaveQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!quiz) return;

    if (!qText.trim() && !qImageUrl && !qImageFile) {
      alert("يجب إدخال نص السؤال أو رفع صورة له على الأقل.");
      return;
    }

    try {
      setIsSavingQ(true);

      // Upload files if selected
      let finalQImageUrl = qImageUrl;
      let finalOptAUrl = optAImageUrl;
      let finalOptBUrl = optBImageUrl;
      let finalOptCUrl = optCImageUrl;
      let finalOptDUrl = optDImageUrl;

      if (qImageFile) finalQImageUrl = await uploadQuizImage(qImageFile);
      if (optAImageFile) finalOptAUrl = await uploadQuizImage(optAImageFile);
      if (optBImageFile) finalOptBUrl = await uploadQuizImage(optBImageFile);
      if (optCImageFile) finalOptCUrl = await uploadQuizImage(optCImageFile);
      if (optDImageFile) finalOptDUrl = await uploadQuizImage(optDImageFile);

      const qPayload = {
        id: selectedQId || undefined,
        question_text: qText.trim(),
        question_image: finalQImageUrl,
        correct_option: correctOption
      };

      const optsPayload = [
        { option_letter: "A" as const, option_text: optAText.trim(), option_image: finalOptAUrl },
        { option_letter: "B" as const, option_text: optBText.trim(), option_image: finalOptBUrl },
        { option_letter: "C" as const, option_text: optCText.trim(), option_image: finalOptCUrl },
        { option_letter: "D" as const, option_text: optDText.trim(), option_image: finalOptDUrl },
      ];

      await saveQuestion(quiz.id, qPayload, optsPayload);
      alert("تم حفظ السؤال بنجاح.");
      setShowQModal(false);
      loadData();
    } catch (err: any) {
      alert("فشل حفظ السؤال: " + err.message);
    } finally {
      setIsSavingQ(false);
    }
  }

  // Delete Question
  async function handleDeleteQ(qId: string) {
    if (!confirm("هل أنت متأكد من حذف هذا السؤال نهائياً؟")) return;
    try {
      await deleteQuestion(qId);
      alert("تم حذف السؤال.");
      loadData();
    } catch (err: any) {
      alert("فشل الحذف: " + err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-2xl" dir="rtl">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-[#7D79F1] mx-auto" size={36} />
          <p className="text-gray-500 font-bold">جاري تحميل بيانات الامتحان والأسئلة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Top Navigation Back Link */}
      <div>
        <Link 
          href={lessonId ? `/admin/lesson?courseId=${courseId}` : `/admin/courses`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#7D79F1] font-bold mb-3"
        >
          <ArrowRight size={14} />
          {lessonId ? "العودة لقائمة المحاضرات" : "العودة لصفحة الكورسات"}
        </Link>

        <h1 className="text-3xl font-extrabold text-[#2D2B7A]">
          {lessonId ? "📚 إدارة واجب المحاضرة" : "🏆 إدارة الامتحان الشامل النهائي"}
        </h1>
        <p className="text-gray-500 mt-1 text-sm font-semibold">
          الكورس: {courseTitle} {lessonTitle && `| المحاضرة: ${lessonTitle}`}
        </p>
      </div>

      {/* Main Grid: Quiz Config & Questions List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quiz Metadata Configuration */}
        <div className="bg-white p-6 rounded-3xl border shadow-sm h-fit space-y-6">
          <h2 className="text-lg font-extrabold text-[#2D2B7A] border-b pb-3 flex items-center gap-2">
            ⚙️ إعدادات الامتحان
          </h2>

          <form onSubmit={handleSaveQuiz} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">عنوان الامتحان</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-[#2D2B7A] focus:border-[#7D79F1] text-sm font-medium"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">درجة النجاح (%)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  className="w-full px-4 py-2.5 rounded-xl border outline-none text-[#2D2B7A] focus:border-[#7D79F1] text-sm font-semibold"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">المؤقت (بالدقائق)</label>
                <input
                  type="number"
                  placeholder="بدون مؤقت"
                  className="w-full px-4 py-2.5 rounded-xl border outline-none text-[#2D2B7A] focus:border-[#7D79F1] text-sm font-semibold"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>

            {/* Time windows (highly relevant for Final Exams) */}
            {!lessonId && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">تاريخ البداية (اختياري)</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 rounded-xl border outline-none text-[#2D2B7A] focus:border-[#7D79F1] text-xs font-medium"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">تاريخ النهاية (اختياري)</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 rounded-xl border outline-none text-[#2D2B7A] focus:border-[#7D79F1] text-xs font-medium"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                className="w-4 h-4 text-[#7D79F1] border-gray-300 rounded focus:ring-[#7D79F1]/20 cursor-pointer"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="is_active" className="text-xs font-bold text-[#2D2B7A] cursor-pointer">
                الامتحان مفعل ومتاح للطلاب
              </label>
            </div>

            <button
              type="submit"
              disabled={isSavingQuiz}
              className="w-full py-3 bg-[#7D79F1] hover:bg-[#655EF0] disabled:bg-gray-300 text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow shadow-[#7D79F1]/20"
            >
              {isSavingQuiz ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              حفظ إعدادات الامتحان
            </button>
          </form>
        </div>

        {/* Right Column: Questions List / Student performance tab switcher */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab Navigation */}
          <div className="flex bg-white rounded-2xl p-1.5 border shadow-sm">
            <button
              onClick={() => setActiveTab("questions")}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "questions" 
                  ? "bg-[#7D79F1] text-white shadow" 
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <FileText size={16} />
              الأسئلة والاختيارات ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "students" 
                  ? "bg-[#7D79F1] text-white shadow" 
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Users size={16} />
              تقارير ودرجات الطلاب
            </button>
          </div>

          {/* QUESTIONS LIST TAB */}
          {activeTab === "questions" && (
            <div className="space-y-4">
              {!quiz ? (
                <div className="bg-white rounded-3xl p-12 border text-center text-gray-400 font-medium">
                  يرجى إنشاء وحفظ إعدادات الامتحان أولاً لتتمكن من إضافة الأسئلة.
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center px-1">
                    <h3 className="font-extrabold text-[#2D2B7A] text-lg">الأسئلة الحالية</h3>
                    <button
                      onClick={openAddQModal}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus size={16} />
                      إضافة سؤال جديد
                    </button>
                  </div>

                  {questions.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 border text-center text-gray-400 font-medium">
                      لا يوجد أسئلة مضافة في هذا الامتحان حالياً. اضغط "إضافة سؤال جديد" للبدء.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((q, idx) => (
                        <div key={q.id} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 relative group">
                          {/* Actions overlay */}
                          <div className="absolute top-6 left-6 flex items-center gap-1.5">
                            <button
                              onClick={() => openEditQModal(q)}
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                              title="تعديل السؤال"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteQ(q.id)}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                              title="حذف السؤال"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="bg-purple-50 text-[#7D79F1] px-3 py-1 rounded-full text-xs font-bold">
                              السؤال {idx + 1}
                            </span>
                            <span className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-xs font-bold">
                              الإجابة الصحيحة: {q.correct_option}
                            </span>
                          </div>

                          <div className="space-y-3 pr-1">
                            {q.question_text && <p className="text-[#2D2B7A] font-extrabold text-base leading-relaxed">{q.question_text}</p>}
                            {q.question_image && (
                              <div className="rounded-xl overflow-hidden border max-w-sm">
                                <img src={q.question_image} alt="Question Graphic" className="w-full object-contain max-h-48" />
                              </div>
                            )}
                          </div>

                          {/* Options grid display */}
                          <div className="grid md:grid-cols-2 gap-3 pr-1 pt-2">
                            {q.options?.map((opt: any) => {
                              const isCorrect = q.correct_option === opt.option_letter;
                              return (
                                <div 
                                  key={opt.id} 
                                  className={`p-3.5 rounded-2xl border text-sm flex flex-col gap-2 ${
                                    isCorrect 
                                      ? "border-green-300 bg-green-50/20 text-green-800 font-bold" 
                                      : "border-gray-100 bg-gray-50/30 text-gray-600"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                                      isCorrect ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                                    }`}>
                                      {opt.option_letter}
                                    </span>
                                    {opt.option_text && <span>{opt.option_text}</span>}
                                  </div>
                                  {opt.option_image && (
                                    <div className="rounded-lg overflow-hidden border max-w-xs mt-1">
                                      <img src={opt.option_image} alt="Option Graphic" className="w-full object-contain max-h-32" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STUDENTS REPORT TAB */}
          {activeTab === "students" && (
            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
              {loadingStudents ? (
                <div className="p-12 text-center text-gray-500 font-bold">جاري تحميل تقارير الطلاب...</div>
              ) : studentPerformance.length === 0 ? (
                <div className="p-12 text-center text-gray-400 font-medium">لا توجد اشتراكات مفعلة أو بيانات حل للطلاب في هذا الكورس بعد.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead className="bg-[#F5F7FB] border-b text-[#2D2B7A] font-bold">
                      <tr>
                        <th className="p-4">الطالب</th>
                        <th className="p-4">الهاتف</th>
                        <th className="p-4 text-center">التقدم</th>
                        <th className="p-4 text-center">
                          {lessonId ? "الواجب الحالي" : "الامتحان النهائي"}
                        </th>
                        <th className="p-4 text-center">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700">
                      {studentPerformance.map((item) => {
                        let assessmentResult: any = null;

                        if (lessonId && quiz) {
                          assessmentResult = item.quizzesResult?.find((qr: any) => qr.quizId === quiz.id);
                        } else {
                          assessmentResult = item.finalExamResult;
                        }

                        const hasRecord = assessmentResult && assessmentResult.attemptsCount > 0;
                        const score = assessmentResult?.highestScore ?? assessmentResult?.score;
                        const attemptsCount = assessmentResult?.attemptsCount ?? (assessmentResult?.status === "submitted" ? 1 : 0);

                        return (
                          <tr key={item.student.id} className="hover:bg-[#F3F2FF]/20 transition">
                            <td className="p-4 font-bold text-[#2D2B7A]">{item.student.full_name}</td>
                            <td className="p-4 text-xs font-semibold">{item.student.phone}</td>
                            <td className="p-4 text-center">
                              <span className="bg-purple-50 text-[#7D79F1] px-2.5 py-1 rounded-full text-xs font-bold border border-purple-100">
                                {item.progress}%
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {hasRecord || (assessmentResult && assessmentResult.status === "submitted") ? (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                  Number(score) >= (quiz?.passing_score || 50)
                                    ? "bg-green-50 text-green-600 border-green-200"
                                    : "bg-red-50 text-red-500 border-red-200"
                                }`}>
                                  {score}% (محاولات: {attemptsCount})
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs font-medium">لم يتم الحل</span>
                              )}
                            </td>
                            <td className="p-4 text-xs text-gray-400 text-center">
                              {hasRecord && assessmentResult.attempts && assessmentResult.attempts[0]
                                ? new Date(assessmentResult.attempts[0].submittedAt).toLocaleDateString("ar-EG")
                                : assessmentResult?.submittedAt
                                ? new Date(assessmentResult.submittedAt).toLocaleDateString("ar-EG")
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* QUESTION MODAL (Add / Edit Question and 4 choices with Image Upload) */}
      {showQModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-extrabold text-[#2D2B7A]">
                {qModalMode === "add" ? "➕ إضافة سؤال جديد" : "📝 تعديل السؤال"}
              </h2>
              <button
                onClick={() => setShowQModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveQuestion} className="p-6 space-y-6">
              
              {/* Question text & image */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500">نص السؤال</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border outline-none text-[#2D2B7A] focus:border-[#7D79F1] text-sm font-medium"
                  placeholder="اكتب صيغة السؤال هنا..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                />
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">صورة السؤال (اختياري)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-xs text-gray-500 border p-2 rounded-xl"
                      onChange={(e) => setQImageFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  {qImageUrl && (
                    <div className="w-16 h-16 rounded-xl border overflow-hidden relative shrink-0">
                      <img src={qImageUrl} alt="Current" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setQImageUrl("")}
                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-full"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Choices: A, B, C, D */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">الاختيارات الأربعة</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  
                  {/* Option A */}
                  <div className="p-4 border rounded-2xl bg-gray-50/50 space-y-3">
                    <label className="block text-xs font-extrabold text-[#7D79F1]">اختيار A</label>
                    <input
                      type="text"
                      placeholder="نص الاختيار A"
                      className="w-full px-3 py-2 rounded-lg border outline-none text-xs text-[#2D2B7A]"
                      value={optAText}
                      onChange={(e) => setOptAText(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="text-[10px] text-gray-400 flex-1 border p-1 rounded-lg"
                        onChange={(e) => setOptAImageFile(e.target.files?.[0] || null)}
                      />
                      {optAImageUrl && (
                        <div className="w-8 h-8 rounded-lg border overflow-hidden shrink-0 relative">
                          <img src={optAImageUrl} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setOptAImageUrl("")} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={8} /></button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Option B */}
                  <div className="p-4 border rounded-2xl bg-gray-50/50 space-y-3">
                    <label className="block text-xs font-extrabold text-[#7D79F1]">اختيار B</label>
                    <input
                      type="text"
                      placeholder="نص الاختيار B"
                      className="w-full px-3 py-2 rounded-lg border outline-none text-xs text-[#2D2B7A]"
                      value={optBText}
                      onChange={(e) => setOptBText(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="text-[10px] text-gray-400 flex-1 border p-1 rounded-lg"
                        onChange={(e) => setOptBImageFile(e.target.files?.[0] || null)}
                      />
                      {optBImageUrl && (
                        <div className="w-8 h-8 rounded-lg border overflow-hidden shrink-0 relative">
                          <img src={optBImageUrl} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setOptBImageUrl("")} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={8} /></button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Option C */}
                  <div className="p-4 border rounded-2xl bg-gray-50/50 space-y-3">
                    <label className="block text-xs font-extrabold text-[#7D79F1]">اختيار C</label>
                    <input
                      type="text"
                      placeholder="نص الاختيار C"
                      className="w-full px-3 py-2 rounded-lg border outline-none text-xs text-[#2D2B7A]"
                      value={optCText}
                      onChange={(e) => setOptCText(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="text-[10px] text-gray-400 flex-1 border p-1 rounded-lg"
                        onChange={(e) => setOptCImageFile(e.target.files?.[0] || null)}
                      />
                      {optCImageUrl && (
                        <div className="w-8 h-8 rounded-lg border overflow-hidden shrink-0 relative">
                          <img src={optCImageUrl} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setOptCImageUrl("")} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={8} /></button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Option D */}
                  <div className="p-4 border rounded-2xl bg-gray-50/50 space-y-3">
                    <label className="block text-xs font-extrabold text-[#7D79F1]">اختيار D</label>
                    <input
                      type="text"
                      placeholder="نص الاختيار D"
                      className="w-full px-3 py-2 rounded-lg border outline-none text-xs text-[#2D2B7A]"
                      value={optDText}
                      onChange={(e) => setOptDText(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="text-[10px] text-gray-400 flex-1 border p-1 rounded-lg"
                        onChange={(e) => setOptDImageFile(e.target.files?.[0] || null)}
                      />
                      {optDImageUrl && (
                        <div className="w-8 h-8 rounded-lg border overflow-hidden shrink-0 relative">
                          <img src={optDImageUrl} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setOptDImageUrl("")} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={8} /></button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Correct Answer Selection */}
              <div className="border-t pt-4">
                <label className="block text-xs font-bold text-gray-500 mb-1.5">تحديد الاختيار الصحيح</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border outline-none text-[#2D2B7A] font-bold text-sm bg-white cursor-pointer focus:border-[#7D79F1]"
                  value={correctOption}
                  onChange={(e) => setCorrectOption(e.target.value as any)}
                >
                  <option value="A">الاختيار A هو الإجابة الصحيحة</option>
                  <option value="B">الاختيار B هو الإجابة الصحيحة</option>
                  <option value="C">الاختيار C هو الإجابة الصحيحة</option>
                  <option value="D">الاختيار D هو الإجابة الصحيحة</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={isSavingQ}
                  className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSavingQ ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  حفظ السؤال
                </button>
                <button
                  type="button"
                  onClick={() => setShowQModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-bold transition text-xs border cursor-pointer text-center"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ExamsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center" dir="rtl">
        <Loader2 className="animate-spin text-[#7D79F1]" size={36} />
      </div>
    }>
      <ExamsPageContent />
    </Suspense>
  );
}
