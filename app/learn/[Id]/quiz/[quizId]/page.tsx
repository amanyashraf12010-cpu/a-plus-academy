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
import { countWords, getWordCountFeedback } from "@/lib/word-counter";
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
  Award,
  BookOpen,
  X,
  FileText
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

// Order questions respecting teacher/admin sequence
function orderExamQuestions(rawQuestions: any[]) {
  return [...rawQuestions].sort((a, b) => {
    const orderA = a.order_num ?? (a.created_at ? new Date(a.created_at).getTime() : 0);
    const orderB = b.order_num ?? (b.created_at ? new Date(b.created_at).getTime() : 0);
    return orderA - orderB;
  });
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
  const [questions, setQuestions] = useState<any[]>([]); // Ordered questions list
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<Record<string, any[]>>({}); // questionId -> Shuffled options
  
  // Quiz Player States
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}); // questionId -> selectedOption ('A'|'B'|'C'|'D')
  const [paragraphAnswers, setParagraphAnswers] = useState<Record<string, string>>({}); // questionId -> answerText
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMobilePassageModal, setShowMobilePassageModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);
  const submittedResultRef = useRef(submittedResult);
  submittedResultRef.current = submittedResult;
  const attemptRef = useRef(attempt);
  attemptRef.current = attempt;
  const quizRef = useRef(quiz);
  quizRef.current = quiz;
  const paragraphSaveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

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
          const restoredParagraphs: Record<string, string> = {};
          savedAnswers.forEach((ans: any) => {
            if (ans.selected_option) {
              restoredAnswers[ans.question_id] = ans.selected_option;
            }
            if (ans.answer_text) {
              restoredParagraphs[ans.question_id] = ans.answer_text;
            }
          });
          setSelectedAnswers(restoredAnswers);
          setParagraphAnswers(restoredParagraphs);
        }

        // Order questions sequence
        const rawQuestions = quizData.questions || [];
        const orderedQ = orderExamQuestions(rawQuestions);
        setQuestions(orderedQ);

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

      // If there is an active in-progress attempt:
      // For final exam: if they already had an active attempt from before, leaving the page means it auto-closes!
      let currentAttempt = activeAttempt;
      if (!currentAttempt) {
        if (quizData.type === "final" && quizData.end_time && new Date(quizData.end_time) < new Date()) {
          setErrorMessage("انتهى وقت الامتحان ولا يمكنك بدء محاولة جديدة.");
          setLoading(false);
          return;
        }
        currentAttempt = await startQuizAttempt(quizData.id);
      } else if (quizData.type === "final") {
        try {
          const result = await submitQuizAttempt(currentAttempt.id);
          setSubmittedResult(result.attempt);
          setAttempt(result.attempt);
          setLoading(false);
          alert("⚠️ تنبيه: لقد قمت بمغادرة صفحة الامتحان الشامل أثناء سريان الوقت سابقاً. تم إغلاق الامتحان وتسجيل إجاباتك تلقائياً.");
          return;
        } catch (e) {
          console.error("Failed to auto-submit exited attempt:", e);
        }
      }

      setAttempt(currentAttempt);

      // 4. Restore student answers if any exist
      const { data: savedAnswers, error: answersError } = await supabase
        .from("student_answers")
        .select("*")
        .eq("attempt_id", currentAttempt.id);

      if (answersError) throw answersError;

      const restoredAnswers: Record<string, string> = {};
      const restoredParagraphs: Record<string, string> = {};
      savedAnswers?.forEach((ans: any) => {
        if (ans.selected_option) {
          restoredAnswers[ans.question_id] = ans.selected_option;
        }
        if (ans.answer_text) {
          restoredParagraphs[ans.question_id] = ans.answer_text;
        }
      });
      setSelectedAnswers(restoredAnswers);
      setParagraphAnswers(restoredParagraphs);

      // 5. Order questions sequence
      const rawQuestions = quizData.questions || [];
      const orderedQ = orderExamQuestions(rawQuestions);
      setQuestions(orderedQ);

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

  // Anti-cheat & Auto-close on tab switch, minimize, or page exit for final exams
  useEffect(() => {
    if (quiz?.type !== "final" || !attempt || attempt.status !== "in_progress" || submittedResult) {
      return;
    }

    const triggerAutoCloseOnExit = async () => {
      if (isSubmittingRef.current || submittedResultRef.current) return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        console.warn("تم رصد مغادرة صفحة الامتحان الشامل، جاري الإغلاق والتسليم الفوري...");
        const result = await submitQuizAttempt(attempt.id);
        setSubmittedResult(result.attempt);
        if (timerRef.current) clearTimeout(timerRef.current);
        setTimeLeft(null);
        alert("⚠️ تنبيه أمان: لقد قمت بمغادرة صفحة الامتحان الشامل أو تبديل التبويب أثناء سريان الوقت! تم إغلاق الامتحان وتسليمه تلقائياً.");
      } catch (err) {
        console.error("خطأ أثناء الإغلاق التلقائي للامتحان:", err);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerAutoCloseOnExit();
      }
    };

    const handlePageHide = () => {
      triggerAutoCloseOnExit();
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submittedResultRef.current && !isSubmittingRef.current) {
        triggerAutoCloseOnExit();
        e.preventDefault();
        e.returnValue = "تحذير: مغادرة الصفحة ستؤدي إلى إغلاق الامتحان الشامل وتسليمه فوراً.";
        return e.returnValue;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [quiz?.type, attempt?.id, attempt?.status, submittedResult]);

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

  // Handle Paragraph text input with debounced auto-save
  function handleParagraphChange(questionId: string, text: string) {
    if (submittedResult) return; // Prevent edits after submission

    setParagraphAnswers((prev) => ({ ...prev, [questionId]: text }));
    setAutoSaveStatus("saving");

    if (paragraphSaveTimeoutRef.current[questionId]) {
      clearTimeout(paragraphSaveTimeoutRef.current[questionId]);
    }

    paragraphSaveTimeoutRef.current[questionId] = setTimeout(async () => {
      try {
        await saveAnswer(attempt.id, questionId, null, text);
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 1500);
      } catch (error) {
        setAutoSaveStatus("error");
      }
    }, 800);
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

    // Check unanswered & word count validity
    let unansweredCount = 0;
    let invalidParagraphsCount = 0;

    questions.forEach((q) => {
      if (q.type === "paragraph") {
        const text = paragraphAnswers[q.id] || "";
        const feedback = getWordCountFeedback(text, q.min_words || 150, q.max_words || 180);
        if (feedback.count === 0) {
          unansweredCount++;
        } else if (!feedback.isValid) {
          invalidParagraphsCount++;
        }
      } else {
        if (!selectedAnswers[q.id]) {
          unansweredCount++;
        }
      }
    });

    if (unansweredCount > 0 && e) {
      const confirmSubmit = confirm(`لديك ${unansweredCount} ${unansweredCount === 1 ? "سؤال غير مجاب عليه" : "أسئلة غير مجاب عليها"}. هل أنت متأكد من رغبتك في تسليم الامتحان؟`);
      if (!confirmSubmit) return;
    }

    if (invalidParagraphsCount > 0 && e) {
      const confirmInvalid = confirm(`⚠️ تنبيه: لديك سؤال مقالي (Paragraph) عدد كلماته لا يقع في النطاق المطلوب (150-180 كلمة). تسليمه الآن سيحتسب الإجابة غير صحيحة ولن يفتح المحاضرة التالية. هل تريد تسليم الامتحان بالتأكيد؟`);
      if (!confirmInvalid) return;
    }

    try {
      setIsSubmitting(true);

      // Flush any pending paragraph saves before submitting
      for (const q of questions) {
        if (q.type === "paragraph" && paragraphAnswers[q.id] !== undefined) {
          await saveAnswer(attempt.id, q.id, null, paragraphAnswers[q.id]);
        }
      }

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
  if (submittedResult || (quiz?.type === "final" && attempt?.status === "submitted")) {
    const finalScore = submittedResult?.score ?? attempt?.score;
    const finalCorrect = submittedResult?.correct_count ?? attempt?.correct_count;
    const finalTotal = submittedResult?.total_questions ?? attempt?.total_questions;
    const isPassed = Number(finalScore) >= quiz?.passing_score;

    const isFinalExam = quiz?.type === "final";
    const isFinalExamDeadlinePassed = !quiz?.end_time || new Date(quiz.end_time) <= new Date();
    
    // For final exam: allowed ONLY if admin enabled show_solutions AND exam deadline has passed
    // For lesson quiz: allowed if score >= passing_score (50%)
    const canViewFinalSolutions = isFinalExam && Boolean(quiz?.show_solutions) && isFinalExamDeadlinePassed;
    const canViewQuizSolutions = !isFinalExam && Number(finalScore) >= (quiz?.passing_score || 50);
    const showDetailedReview = isFinalExam ? canViewFinalSolutions : canViewQuizSolutions;

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
                      setParagraphAnswers({});
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

          {/* Locked Notice for Final Exams when solutions are hidden */}
          {isFinalExam && !canViewFinalSolutions && (
            <div className="bg-purple-50 text-[#2D2B7A] p-6 rounded-3xl border border-purple-150 text-center space-y-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-[#7D79F1] shadow-xs">
                <Clock size={24} className="animate-pulse" />
              </div>
              <h3 className="font-extrabold text-[#2D2B7A] text-lg">مراجعة وتصحيح الأسئلة محجوبة حالياً</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                {quiz?.end_time && new Date(quiz.end_time) > new Date()
                  ? `تم تسجيل درجتك بنجاح. ستتاح مراجعة وتصحيح الأسئلة لجميع الطلاب بعد إغلاق موعد الامتحان النهائي في: ${new Date(quiz.end_time).toLocaleString("ar-EG")}.`
                  : "تم تسجيل درجتك بنجاح. ستتاح مراجعة وتصحيح الأسئلة للجميع فور إتاحتها وتفعيلها من قِبل إدارة الأكاديمية."}
              </p>
            </div>
          )}

          {/* Detailed Correction (When allowed) */}
          {showDetailedReview && quiz.questions?.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-xl font-extrabold text-[#2D2B7A]">🔍 مراجعة وتصحيح الأسئلة</h2>
                {isFinalExam && (
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                    تم فتح الحل النموذجي
                  </span>
                )}
              </div>

              {quiz.questions.map((q: any, idx: number) => {
                const isParagraph = q.type === "paragraph";
                const studentAns = selectedAnswers[q.id];
                const studentText = paragraphAnswers[q.id] || "";
                const wordCount = countWords(studentText);
                const minWords = q.min_words || 150;
                const maxWords = q.max_words || 180;
                const isParagraphCorrect = wordCount >= minWords && wordCount <= maxWords;
                const isMcqCorrect = studentAns === q.correct_option;
                const isCorrect = isParagraph ? isParagraphCorrect : isMcqCorrect;
                
                return (
                  <div key={q.id} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {isParagraph ? (
                          <span className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <FileText size={13} />
                            سؤال مقالي (Paragraph) #{idx + 1}
                          </span>
                        ) : (
                          <span className="bg-purple-50 text-[#7D79F1] px-3 py-1 rounded-full text-xs font-bold">السؤال {idx + 1}</span>
                        )}
                        {q.passage_title && (
                          <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                            <BookOpen size={12} />
                            {q.passage_title}
                          </span>
                        )}
                        {isParagraph && (
                          <span className="bg-purple-50 text-[#7D79F1] border border-purple-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            المطلوب: {minWords} - {maxWords} كلمة
                          </span>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        isCorrect ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-500 border border-red-200"
                      }`}>
                        {isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {isParagraph 
                          ? (isCorrect ? `إجابة صحيحة (${wordCount} كلمة)` : `غير مطابقة للكلمات (${wordCount} كلمة)`) 
                          : (isCorrect ? "إجابة صحيحة" : "إجابة خاطئة")}
                      </span>
                    </div>

                    {/* Passage box if belongs to a reading passage */}
                    {q.passage_text && (
                      <div className="bg-purple-50/40 border border-purple-150 rounded-2xl p-4 text-left font-sans space-y-2" dir="ltr">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#7D79F1]" dir="rtl">
                          <BookOpen size={14} />
                          <span>قطعة القراءة: {q.passage_title || "Reading Passage"}</span>
                        </div>
                        <div className="text-gray-700 text-xs md:text-sm whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto p-3 bg-white/80 rounded-xl border border-purple-100">
                          {q.passage_text}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {q.question_text && <p className="text-[#2D2B7A] font-extrabold text-base leading-relaxed">{q.question_text}</p>}
                      {q.question_image && (
                        <div className="rounded-xl overflow-hidden border max-w-md">
                          <img src={q.question_image} alt="Question Graphic" className="w-full object-contain max-h-60" />
                        </div>
                      )}
                    </div>

                    {/* Paragraph Question Review */}
                    {isParagraph ? (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-gray-600">✍️ نص إجابتك المسلمة:</span>
                          <span className={isCorrect ? "text-green-600" : "text-red-500"}>
                            عدد الكلمات: {wordCount} كلمة {isCorrect ? "✓ (مطابق للشروط)" : `(المطلوب بين ${minWords} و ${maxWords} كلمة)`}
                          </span>
                        </div>
                        <div 
                          dir="auto"
                          className={`p-4 rounded-2xl border text-sm leading-relaxed whitespace-pre-wrap font-sans ${
                            isCorrect ? "bg-green-50/20 border-green-200 text-gray-800" : "bg-red-50/20 border-red-200 text-gray-800"
                          }`}
                        >
                          {studentText ? studentText : <span className="text-gray-400 italic">لم يتم إدخال نص لهذا السؤال.</span>}
                        </div>
                      </div>
                    ) : (
                      /* MCQ Choices correction grid */
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
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback Banner if score < 50% for Lesson Quizzes */}
          {!isFinalExam && !showDetailedReview && quiz.questions?.length > 0 && (
            <div className="bg-amber-50 text-amber-800 p-6 rounded-3xl border border-amber-250 text-center space-y-3">
              <AlertTriangle className="text-amber-500 mx-auto animate-pulse" size={32} />
              <h3 className="font-extrabold text-[#2D2B7A] text-lg">مراجعة وتصحيح الأسئلة محجوبة</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                يجب عليك الحصول على <strong>50%</strong> على الأقل في هذا الاختبار لتتمكن من مراجعة الإجابات الصحيحة وتصحيح الأخطاء.
              </p>
              {quiz.type === "quiz" && (
                <p className="text-xs text-gray-500 font-bold">
                  يمكنك الضغط على زر "إعادة المحاولة" أعلاه للمحاولة مجدداً وتحسين نتيجتك! 💪
                </p>
              )}
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
  const isPassageQuestion = Boolean(currentQuestion?.passage_text);

  return (
    <div className="min-h-screen bg-[#F8F9FD] py-8 md:py-12 px-4 md:px-6" dir="rtl">
      <div className={`${isPassageQuestion ? "max-w-6xl" : "max-w-3xl"} mx-auto space-y-6`}>
        
        {/* Header Bar */}
        <div className="bg-white rounded-3xl border shadow-sm p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                if (quiz.type === "final") {
                  if (confirm("⚠️ تحذير أمان: هذا امتحان شامل مراقب بوقت! الخروج من صفحة الامتحان الآن سيؤدي إلى إنهاء وتسليم محاولتك فوراً ولن تتمكن من العودة إليه. هل أنت متأكد من الخروج وتسليم الامتحان؟")) {
                    setIsSubmitting(true);
                    try {
                      const result = await submitQuizAttempt(attempt.id);
                      setSubmittedResult(result.attempt);
                      router.push(`/learn/${courseId}`);
                    } catch (err) {
                      console.error(err);
                      router.push(`/learn/${courseId}`);
                    }
                  }
                } else {
                  if (confirm("هل تريد بالفعل التراجع والخروج لصفحة المحاضرات؟ سيتم حفظ إجاباتك الحالية تلقائياً.")) {
                    router.push(`/learn/${courseId}`);
                  }
                }
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-150 transition cursor-pointer"
              title="خروج"
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

        {/* Security Warning Banner for Final Exam */}
        {quiz.type === "final" && !submittedResult && (
          <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 text-red-900 p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-bold shadow-xs">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl shrink-0">
              <AlertTriangle size={18} className="animate-pulse" />
            </div>
            <div className="leading-relaxed">
              <span className="text-red-700 font-black">🔒 نظام مراقبة الامتحان الشامل نشط:</span> يمنع مغادرة الصفحة، تصغير المتصفح، أو الانتقال لتبويب آخر. أي خروج سيؤدي إلى قفل الامتحان وتسليمه تلقائياً فوراً.
            </div>
          </div>
        )}

        {/* Mobile Passage Button if this is a reading passage question */}
        {isPassageQuestion && (
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setShowMobilePassageModal(true)}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#7D79F1] to-[#655EF0] text-white rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 hover:opacity-95 transition cursor-pointer"
            >
              <BookOpen size={18} />
              <span>📖 عرض قطعة القراءة (Reading Passage)</span>
            </button>
          </div>
        )}

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

        {/* Question + Passage Layout */}
        {currentQuestion && (
          <div className={isPassageQuestion ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" : ""}>
            
            {/* Desktop Passage Column */}
            {isPassageQuestion && (
              <div className="hidden lg:flex lg:col-span-5 bg-white rounded-3xl border shadow-sm p-6 flex-col max-h-[calc(100vh-180px)] sticky top-6">
                <div className="flex items-center gap-2 pb-3 border-b mb-3">
                  <div className="p-2 bg-purple-50 text-[#7D79F1] rounded-xl">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#2D2B7A] text-sm">
                      {currentQuestion.passage_title || "قطعة القراءة (Reading Passage)"}
                    </h3>
                    <p className="text-[11px] text-gray-400">اقرأ النص للإجابة على الأسئلة التابعة له</p>
                  </div>
                </div>

                <div 
                  dir="ltr"
                  className="overflow-y-auto pr-3 text-left font-sans text-gray-800 text-sm leading-relaxed whitespace-pre-wrap selection:bg-purple-100 flex-1 p-3 bg-gray-50/70 rounded-2xl border border-gray-100"
                >
                  {currentQuestion.passage_text}
                </div>
              </div>
            )}

            {/* Question Card */}
            <div className={`${isPassageQuestion ? "lg:col-span-7" : ""} bg-white rounded-3xl border shadow-sm p-6 md:p-8 space-y-6 min-h-[350px] flex flex-col justify-between`}>
              <div className="space-y-4">
                
                {/* Passage indicator badge if passage question */}
                {isPassageQuestion && (
                  <div className="inline-flex items-center gap-1.5 bg-purple-50 text-[#7D79F1] px-3 py-1 rounded-full text-xs font-bold border border-purple-100">
                    <BookOpen size={13} />
                    <span>سؤال تابع لقطعة القراءة</span>
                  </div>
                )}

                {/* Paragraph indicator badge if paragraph question */}
                {currentQuestion.type === "paragraph" && (
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                    <FileText size={13} className="text-amber-600" />
                    <span>سؤال مقالي (Paragraph) — المطلوب: {currentQuestion.min_words || 150} إلى {currentQuestion.max_words || 180} كلمة</span>
                  </div>
                )}

                {/* Question contents */}
                <div className="space-y-3">
                  {currentQuestion.question_text && (
                    <p className="text-[#2D2B7A] font-extrabold text-base md:text-lg leading-relaxed">{currentQuestion.question_text}</p>
                  )}
                  {currentQuestion.question_image && (
                    <div className="rounded-2xl overflow-hidden border max-w-lg">
                      <img src={currentQuestion.question_image} alt="Question Illustration" className="w-full object-contain max-h-64" />
                    </div>
                  )}
                </div>

                {/* Paragraph Input Area & Live Word Counter */}
                {currentQuestion.type === "paragraph" ? (
                  <div className="space-y-4 pt-2">
                    {(() => {
                      const text = paragraphAnswers[currentQuestion.id] || "";
                      const feedback = getWordCountFeedback(
                        text, 
                        currentQuestion.min_words || 150, 
                        currentQuestion.max_words || 180
                      );

                      let badgeBg = "bg-purple-50 text-[#7D79F1] border-purple-200";
                      let barColor = "bg-[#7D79F1]";
                      if (feedback.status === "under") {
                        badgeBg = "bg-amber-50 text-amber-900 border-amber-300";
                        barColor = "bg-amber-500";
                      } else if (feedback.status === "valid") {
                        badgeBg = "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold";
                        barColor = "bg-emerald-500";
                      } else if (feedback.status === "over") {
                        badgeBg = "bg-red-50 text-red-900 border-red-300";
                        barColor = "bg-red-500";
                      }

                      const percentToMin = Math.min(100, Math.round((feedback.count / feedback.minWords) * 100));

                      return (
                        <div className="space-y-3">
                          {/* Live Counter Info Card */}
                          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-gray-50/90 rounded-2xl border border-gray-200">
                            <div className="flex items-center gap-2">
                              <FileText size={18} className="text-[#7D79F1]" />
                              <span className="text-xs font-black text-[#2D2B7A]">
                                عداد الكلمات: {feedback.minWords} - {feedback.maxWords} كلمة
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3.5 py-1 rounded-full text-xs border font-extrabold ${badgeBg}`}>
                                {feedback.count} / {feedback.minWords}-{feedback.maxWords} كلمة
                              </span>
                            </div>
                          </div>

                          {/* Dynamic Feedback Banner */}
                          <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 transition-all duration-200 ${badgeBg}`}>
                            <span>{feedback.message}</span>
                            {feedback.isValid ? (
                              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                            ) : feedback.status === "over" ? (
                              <AlertTriangle size={18} className="text-red-500 shrink-0" />
                            ) : null}
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${barColor}`}
                              style={{ width: `${feedback.count > feedback.maxWords ? 100 : percentToMin}%` }}
                            />
                          </div>

                          {/* Textarea Input */}
                          <div className="space-y-1.5 pt-2">
                            <label className="block text-xs font-bold text-gray-600">
                              اكتب المقال المطلوب هنا (Text Area):
                            </label>
                            <textarea
                              rows={9}
                              dir="auto"
                              value={text}
                              onChange={(e) => handleParagraphChange(currentQuestion.id, e.target.value)}
                              placeholder="ابدأ بكتابة إجابتك هنا باللغة الإنجليزية أو العربية... سيتم حفظ النص تلقائياً ومطابقة عدد الكلمات المطلوبة."
                              className="w-full p-4 rounded-2xl border-2 border-gray-200 outline-none text-gray-800 focus:border-[#7D79F1] text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans bg-white shadow-xs focus:ring-4 focus:ring-[#7D79F1]/10 transition"
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* Shuffled Options list for MCQ */
                  <div className="grid md:grid-cols-2 gap-3 md:gap-4 pt-2">
                    {(shuffledOptionsMap[currentQuestion.id] || []).map((opt: any) => {
                      const isSelected = selectedAnswers[currentQuestion.id] === opt.option_letter;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleOptionSelect(currentQuestion.id, opt.option_letter)}
                          className={`w-full text-right p-4 md:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 ${
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
                )}

              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-6 border-t mt-8 gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentQIndex(currentQIndex - 1)}
                  disabled={isFirst}
                  className="py-3 px-5 border rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
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

          </div>
        )}

        {/* Mobile Passage Modal Drawer */}
        {showMobilePassageModal && isPassageQuestion && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
              {/* Modal Header */}
              <div className="p-5 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-[#7D79F1] rounded-xl">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#2D2B7A] text-base">
                      {currentQuestion.passage_title || "قطعة القراءة (Reading Passage)"}
                    </h3>
                    <p className="text-xs text-gray-400">اقرأ القطعة بتركيز ثم أجب عن الأسئلة</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobilePassageModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div 
                dir="ltr"
                className="p-6 overflow-y-auto text-left font-sans text-gray-800 text-sm md:text-base leading-relaxed whitespace-pre-wrap flex-1 bg-gray-50/50"
              >
                {currentQuestion.passage_text}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t bg-white rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setShowMobilePassageModal(false)}
                  className="w-full py-3 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold text-sm transition cursor-pointer"
                >
                  العودة للأسئلة
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
