"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  getQuizForLesson, 
  getFinalExamForCourse, 
  startQuizAttempt, 
  saveAnswer, 
  submitQuizAttempt,
  getQuizAttempts
} from "@/lib/quizzes";
import { 
  Loader2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Award
} from "lucide-react";
import Link from "next/link";

// Simple Fisher-Yates shuffle helper
function shuffleArray(array: any[]) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function StudentQuizPage() {
  const params = useParams<any>();
  const courseId = params?.id || params?.Id;
  const quizId = params?.quizId;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]); // Shuffled questions list
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<Record<string, any[]>>({}); // questionId -> Shuffled options
  
  // Quiz Player States
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}); // questionId -> selectedOption ('A'|'B'|'C'|'D')
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Quiz data and attempts
  async function loadQuizAndAttempt() {
    try {
      setLoading(true);
      setErrorMessage(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("يجب تسجيل الدخول للوصول لهذه الصفحة.");
        setLoading(false);
        return;
      }

      // 1. Fetch Quiz Details
      // We will look up by quizId
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*, questions(*, options(*))")
        .eq("id", quizId)
        .single();

      if (quizError || !quizData) {
        setErrorMessage("لم يتم العثور على هذا الواجب أو الامتحان.");
        setLoading(false);
        return;
      }

      setQuiz(quizData);

      // 2. Validate Final Exam timeline
      if (quizData.type === "final") {
        const now = new Date();
        if (quizData.start_time && new Date(quizData.start_time) > now) {
          setErrorMessage(`هذا الامتحان لم يبدأ بعد. موعد البدء: ${new Date(quizData.start_time).toLocaleString("ar-EG")}`);
          setLoading(false);
          return;
        }
        if (quizData.end_time && new Date(quizData.end_time) < now) {
          // If past deadline, check if they had an attempt, otherwise they missed it
          const attempts = await getQuizAttempts(user.id, quizData.id);
          if (attempts.length === 0) {
            setErrorMessage(`انتهى موعد هذا الامتحان الشامل في: ${new Date(quizData.end_time).toLocaleString("ar-EG")}. ولم تقم بالمشاركة فيه.`);
            setLoading(false);
            return;
          }
        }
      }

      // 3. Fetch past attempts
      const pastAttempts = await getQuizAttempts(user.id, quizData.id);
      const perfectAttempt = pastAttempts.find((att: any) => att.status === "submitted" && att.score === 100);

      if (perfectAttempt) {
        setSubmittedResult(perfectAttempt);
        setAttempt(perfectAttempt);

        // Restore student answers for the perfect attempt
        const { data: savedAnswers, error: answersError } = await supabase
          .from("student_answers")
          .select("*")
          .eq("attempt_id", perfectAttempt.id);

        if (!answersError && savedAnswers) {
          const restoredAnswers: Record<string, string> = {};
          savedAnswers.forEach((ans: any) => {
            restoredAnswers[ans.question_id] = ans.selected_option;
          });
          setSelectedAnswers(restoredAnswers);
        }

        // Shuffle questions and choices
        const rawQuestions = quizData.questions || [];
        const shuffledQ = shuffleArray(rawQuestions);
        setQuestions(shuffledQ);

        const optionsMap: Record<string, any[]> = {};
        rawQuestions.forEach((q: any) => {
          optionsMap[q.id] = shuffleArray(q.options || []);
        });
        setShuffledOptionsMap(optionsMap);

        setLoading(false);
        return;
      }

      const activeAttempt = pastAttempts.find((att: any) => att.status === "in_progress");
      const submittedAttempt = pastAttempts.find((att: any) => att.status === "submitted");

      // For final exams: only 1 attempt is allowed! If they already submitted, show results!
      if (quizData.type === "final" && submittedAttempt) {
        setSubmittedResult(submittedAttempt);
        setAttempt(submittedAttempt);
        setLoading(false);
        return;
      }

      // If there is an active in-progress attempt, restore it. Otherwise start a new one (unless it's final exam and deadline passed)
      let currentAttempt = activeAttempt;
      if (!currentAttempt) {
        if (quizData.type === "final" && quizData.end_time && new Date(quizData.end_time) < new Date()) {
          setErrorMessage("انتهى وقت الامتحان ولا يمكنك بدء محاولة جديدة.");
          setLoading(false);
          return;
        }
        currentAttempt = await startQuizAttempt(quizData.id);
      }

      setAttempt(currentAttempt);

      // 4. Restore student answers if any exist
      const { data: savedAnswers, error: answersError } = await supabase
        .from("student_answers")
        .select("*")
        .eq("attempt_id", currentAttempt.id);

      if (answersError) throw answersError;

      const restoredAnswers: Record<string, string> = {};
      savedAnswers?.forEach((ans: any) => {
        restoredAnswers[ans.question_id] = ans.selected_option;
      });
      setSelectedAnswers(restoredAnswers);

      // 5. Shuffle questions and choices
      const rawQuestions = quizData.questions || [];
      const shuffledQ = shuffleArray(rawQuestions);
      setQuestions(shuffledQ);

      const optionsMap: Record<string, any[]> = {};
      rawQuestions.forEach((q: any) => {
        optionsMap[q.id] = shuffleArray(q.options || []);
      });
      setShuffledOptionsMap(optionsMap);

      // 6. Setup Timer if final exam
      if (quizData.type === "final" && quizData.duration) {
        const timeLimitMs = quizData.duration * 60 * 1000;
        const elapsedMs = Date.now() - new Date(currentAttempt.started_at).getTime();
        const remainingSec = Math.max(0, Math.floor((timeLimitMs - elapsedMs) / 1000));
        
        setTimeLeft(remainingSec);
        
        if (remainingSec <= 0) {
          // Time expired while restoring, auto-submit
          await handleAutoSubmit(currentAttempt.id);
        }
      }

    } catch (err: any) {
      console.error("خطأ أثناء إعداد صفحة الحل:", err);
      setErrorMessage("حدث خطأ غير متوقع أثناء تحميل البيانات.");
    } finally {
      setLoading(false);
    }
  }

  // Timer tick effect
  useEffect(() => {
    if (timeLeft === null || submittedResult) return;

    if (timeLeft <= 0) {
      handleAutoSubmit(attempt.id);
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, submittedResult]);

  useEffect(() => {
    if (quizId) {
      loadQuizAndAttempt();
    }
  }, [quizId]);

  // Handle Option Select (triggers Auto Save)
  async function handleOptionSelect(questionId: string, optionLetter: string) {
    if (submittedResult) return; // Prevent edits after submission

    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionLetter }));
    setAutoSaveStatus("saving");

    try {
      await saveAnswer(attempt.id, questionId, optionLetter);
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 1500);
    } catch (error) {
      setAutoSaveStatus("error");
    }
  }

  // Format seconds to MM:SS
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // Submit attempt
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (submittedResult) return;

    const unansweredCount = questions.length - Object.keys(selectedAnswers).length;
    if (unansweredCount > 0 && e) {
      const confirmSubmit = confirm(`لديك ${unansweredCount} سؤالاً غير مجاب عليها. هل أنت متأكد من رغبتك في تسليم الامتحان؟`);
      if (!confirmSubmit) return;
    }

    try {
      setIsSubmitting(true);
      const result = await submitQuizAttempt(attempt.id);
      setSubmittedResult(result.attempt);
      
      // Clear timer
      if (timerRef.current) clearTimeout(timerRef.current);
      setTimeLeft(null);
      
      alert("تم تسليم إجاباتك بنجاح وتصحيحها!");
    } catch (err: any) {
      alert("خطأ أثناء تسليم الإجابات: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Auto-submit when timer ends
  async function handleAutoSubmit(attemptId: string) {
    try {
      setIsSubmitting(true);
      const result = await submitQuizAttempt(attemptId);
      setSubmittedResult(result.attempt);
      alert("⏱️ انتهى الوقت المحدد للامتحان! تم تسليم إجاباتك تلقائياً بنجاح.");
    } catch (error) {
      console.error("فشل الإرسال التلقائي للوقت:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]" dir="rtl">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-[#7D79F1] mx-auto" size={40} />
          <p className="text-[#2D2B7A] font-bold text-lg">جاري تحميل أسئلة الاختبار وتأمين الاتصال...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD] p-6" dir="rtl">
        <div className="bg-white p-8 rounded-3xl border shadow-sm max-w-md w-full text-center space-y-4">
          <AlertTriangle className="text-red-500 mx-auto" size={48} />
          <h2 className="text-xl font-extrabold text-[#2D2B7A]">تعذر فتح الصفحة</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{errorMessage}</p>
          <button
            onClick={() => router.push(`/learn/${courseId}`)}
            className="w-full py-3 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowRight size={16} />
            العودة لصفحة الدروس
          </button>
        </div>
      </div>
    );
  }

  // If already submitted and showing results!
  const isFinalBeforeDeadline = quiz?.type === "final" && quiz?.end_time && new Date(quiz.end_time) > new Date();
  
  if (submittedResult || (quiz?.type === "final" && attempt?.status === "submitted")) {
    const finalScore = submittedResult?.score ?? attempt?.score;
    const finalCorrect = submittedResult?.correct_count ?? attempt?.correct_count;
    const finalTotal = submittedResult?.total_questions ?? attempt?.total_questions;
    const isPassed = Number(finalScore) >= quiz?.passing_score;

    return (
      <div className="min-h-screen bg-[#F8F9FD] py-12 px-6" dir="rtl">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Result Card Banner */}
          <div className="bg-white rounded-3xl border shadow-sm p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-purple-50 rounded-full flex items-center justify-center border border-purple-100 text-[#7D79F1]">
              <Award size={40} />
            </div>

            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{quiz.type === "final" ? "الامتحان الشامل" : "واجب المحاضرة"}</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D2B7A] mt-1">{quiz.title}</h1>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="bg-gray-50 p-4 rounded-2xl border text-center">
                <span className="text-xs text-gray-400 font-bold block mb-1">النسبة المئوية</span>
                <span className="text-2xl font-black text-[#7D79F1]">{finalScore}%</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border text-center">
                <span className="text-xs text-gray-400 font-bold block mb-1">حالة النتيجة</span>
                <span className={`text-base font-bold ${isPassed ? "text-green-600" : "text-red-500"}`}>
                  {isPassed ? "🎉 ناجح ومجتاز" : "❌ لم تجتز بعد"}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 font-medium">
              الأسئلة الصحيحة: <span className="font-bold text-[#2D2B7A]">{finalCorrect}</span> من أصل <span className="font-bold text-[#2D2B7A]">{finalTotal}</span> أسئلة.
            </p>

            {isFinalBeforeDeadline ? (
              <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl border border-blue-100 text-xs text-right leading-relaxed flex gap-2">
                <Clock size={16} className="shrink-0 text-blue-600 mt-0.5" />
                <span>
                  <strong>تنبيه الأمان والنزاهة:</strong> تم حجب مراجعة الإجابات والأخطاء حالياً وسيتم إتاحتها تلقائياً بعد إغلاق موعد الامتحان النهائي للجميع في تاريخ <strong>{new Date(quiz.end_time).toLocaleString("ar-EG")}</strong>.
                </span>
              </div>
            ) : null}

            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={() => router.push(`/learn/${courseId}`)}
                className="flex-1 py-3 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                العودة للمحاضرات
              </button>
              {quiz.type === "quiz" && Number(finalScore) < 100 && (
                <button
                  onClick={() => {
                    if (confirm("هل تريد بالفعل إعادة البدء وحل المحاضرة مرة أخرى للتمرين؟ سيبدأ عداد محاولاتك من جديد.")) {
                      setSubmittedResult(null);
                      setAttempt(null);
                      setSelectedAnswers({});
                      loadQuizAndAttempt();
                    }
                  }}
                  className="py-3 px-6 bg-white hover:bg-gray-50 border text-[#7D79F1] rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={15} />
                  إعادة المحاولة
                </button>
              )}
            </div>
          </div>

          {/* Detailed Correction (Only if Lesson Quiz or after Final Exam Deadline) */}
          {(!isFinalBeforeDeadline && quiz.questions?.length > 0) && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-[#2D2B7A] border-b pb-3">🔍 مراجعة وتصحيح الأسئلة</h2>
              {quiz.questions.map((q: any, idx: number) => {
                const studentAns = selectedAnswers[q.id];
                const isCorrect = studentAns === q.correct_option;
                
                return (
                  <div key={q.id} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="bg-purple-50 text-[#7D79F1] px-3 py-1 rounded-full text-xs font-bold">السؤال {idx + 1}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        isCorrect ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-500 border border-red-200"
                      }`}>
                        {isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {isCorrect ? "إجابة صحيحة" : "إجابة خاطئة"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {q.question_text && <p className="text-[#2D2B7A] font-extrabold text-base leading-relaxed">{q.question_text}</p>}
                      {q.question_image && (
                        <div className="rounded-xl overflow-hidden border max-w-md">
                          <img src={q.question_image} alt="Question Graphic" className="w-full object-contain max-h-60" />
                        </div>
                      )}
                    </div>

                    {/* Choices correction grid */}
                    <div className="grid md:grid-cols-2 gap-3 pt-2">
                      {q.options?.map((opt: any) => {
                        const isStudentChoice = studentAns === opt.option_letter;
                        const isCorrectChoice = q.correct_option === opt.option_letter;
                        
                        let optBorderClass = "border-gray-100 bg-white";
                        if (isCorrectChoice) {
                          optBorderClass = "border-green-500 bg-green-50/30 text-green-800 font-bold";
                        } else if (isStudentChoice && !isCorrectChoice) {
                          optBorderClass = "border-red-400 bg-red-50/30 text-red-800";
                        }

                        return (
                          <div key={opt.id} className={`p-4 rounded-2xl border transition text-sm flex flex-col justify-center gap-2 ${optBorderClass}`}>
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                                isCorrectChoice
                                  ? "bg-green-600 text-white"
                                  : isStudentChoice
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-100 text-gray-500"
                              }`}>
                                {opt.option_letter}
                              </span>
                              {opt.option_text && <span>{opt.option_text}</span>}
                            </div>
                            {opt.option_image && (
                              <div className="rounded-lg overflow-hidden border max-w-xs mt-1">
                                <img src={opt.option_image} alt="Option Graphic" className="w-full object-contain max-h-40" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    );
  }

  // Quiz active solver UI
  const currentQuestion = questions[currentQIndex];
  const totalQuestions = questions.length;
  const isFirst = currentQIndex === 0;
  const isLast = currentQIndex === totalQuestions - 1;

  return (
    <div className="min-h-screen bg-[#F8F9FD] py-12 px-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="bg-white rounded-3xl border shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm("هل تريد بالفعل التراجع والخروج لصفحة المحاضرات؟ سيتم حفظ إجاباتك الحالية تلقائياً.")) {
                  router.push(`/learn/${courseId}`);
                }
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-150 transition cursor-pointer"
              title="خروج وحفظ"
            >
              <ArrowRight size={20} />
            </button>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{quiz.type === "final" ? "الامتحان النهائي الشامل" : "الواجب الدراسي"}</p>
              <h1 className="text-xl font-extrabold text-[#2D2B7A] mt-0.5">{quiz.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Auto Save Status Indicator */}
            <div className="text-xs font-semibold">
              {autoSaveStatus === "saving" && <span className="text-[#7D79F1] flex items-center gap-1">🔄 جاري الحفظ...</span>}
              {autoSaveStatus === "saved" && <span className="text-green-600 flex items-center gap-1">✓ تم الحفظ تلقائياً</span>}
              {autoSaveStatus === "error" && <span className="text-red-500 flex items-center gap-1">⚠️ خطأ في الاتصال</span>}
            </div>

            {/* Countdown timer */}
            {timeLeft !== null && (
              <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-2.5 rounded-2xl flex items-center gap-2 font-black text-sm">
                <Clock size={16} className="animate-pulse" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex justify-between items-center text-xs font-bold text-gray-500 px-2">
          <span>السؤال {currentQIndex + 1} من أصل {totalQuestions}</span>
          <span>نسبة التقدم: {Math.round(((currentQIndex + 1) / totalQuestions) * 100)}%</span>
        </div>

        <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#7D79F1] to-[#655EF0] h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentQIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question Panel */}
        {currentQuestion && (
          <div className="bg-white rounded-3xl border shadow-sm p-8 space-y-6 min-h-[350px] flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Question contents */}
              <div className="space-y-3">
                {currentQuestion.question_text && (
                  <p className="text-[#2D2B7A] font-extrabold text-lg leading-relaxed">{currentQuestion.question_text}</p>
                )}
                {currentQuestion.question_image && (
                  <div className="rounded-2xl overflow-hidden border max-w-lg">
                    <img src={currentQuestion.question_image} alt="Question Illustration" className="w-full object-contain max-h-64" />
                  </div>
                )}
              </div>

              {/* Shuffled Options list */}
              <div className="grid md:grid-cols-2 gap-4 pt-4">
                {(shuffledOptionsMap[currentQuestion.id] || []).map((opt: any) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === opt.option_letter;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionSelect(currentQuestion.id, opt.option_letter)}
                      className={`w-full text-right p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 ${
                        isSelected
                          ? "border-[#7D79F1] bg-[#F3F2FF] shadow-sm scale-[0.99] font-bold text-[#2D2B7A]"
                          : "border-gray-100 hover:border-gray-200 bg-white text-gray-700 hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border transition ${
                          isSelected
                            ? "bg-[#7D79F1] text-white border-[#7D79F1]"
                            : "bg-gray-50 text-gray-400 border-gray-100"
                        }`}>
                          {isSelected ? <Check size={14} /> : opt.option_letter}
                        </span>
                        {opt.option_text && <span className="text-sm font-medium">{opt.option_text}</span>}
                      </div>

                      {opt.option_image && (
                        <div className="rounded-xl overflow-hidden border max-w-xs mt-2 self-start mr-10">
                          <img src={opt.option_image} alt="Option Illustration" className="w-full object-contain max-h-36" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-6 border-t mt-8 gap-3">
              <button
                type="button"
                onClick={() => setCurrentQIndex(currentQIndex - 1)}
                disabled={isFirst}
                className="py-3 px-5 border rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <ChevronRight size={18} />
                السابق
              </button>

              {!isLast ? (
                <button
                  type="button"
                  onClick={() => setCurrentQIndex(currentQIndex + 1)}
                  className="py-3 px-6 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold text-sm transition flex items-center gap-1 cursor-pointer"
                >
                  التالي
                  <ChevronLeft size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="py-3 px-8 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition flex items-center gap-1 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
                  إنهاء وتسليم الإجابات
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
