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
  getCourseStudentPerformance,
  savePassageGroup,
  deletePassageGroup,
  bulkImportQuestions
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
  Users,
  BookOpen,
  ArrowUp,
  ArrowDown
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

  // Import questions states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCourses, setImportCourses] = useState<any[]>([]);
  const [selectedImportCourseId, setSelectedImportCourseId] = useState("");
  const [importQuizzes, setImportQuizzes] = useState<any[]>([]);
  const [selectedImportQuizId, setSelectedImportQuizId] = useState("");
  const [importQuestions, setImportQuestions] = useState<any[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

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

  // Passage Group States
  const [showPassageModal, setShowPassageModal] = useState(false);
  const [passageModalMode, setPassageModalMode] = useState<"add" | "edit">("add");
  const [passageGroupId, setPassageGroupId] = useState("");
  const [passageTitle, setPassageTitle] = useState("");
  const [passageText, setPassageText] = useState("");
  const [passageQuestions, setPassageQuestions] = useState<Array<{
    id?: string;
    question_text: string;
    question_image?: string;
    question_image_file?: File | null;
    correct_option: "A" | "B" | "C" | "D";
    options: Array<{
      option_letter: "A" | "B" | "C" | "D";
      option_text?: string;
      option_image?: string;
      option_image_file?: File | null;
    }>;
  }>>([]);
  const [deletedPassageQIds, setDeletedPassageQIds] = useState<string[]>([]);
  const [isSavingPassage, setIsSavingPassage] = useState(false);

  // Sub-question form state inside Passage Modal
  const [showPassageQForm, setShowPassageQForm] = useState(false);
  const [editingPassageQIndex, setEditingPassageQIndex] = useState<number | null>(null);
  const [pqText, setPqText] = useState("");
  const [pqImageUrl, setPqImageUrl] = useState("");
  const [pqImageFile, setPqImageFile] = useState<File | null>(null);
  const [pqCorrectOption, setPqCorrectOption] = useState<"A" | "B" | "C" | "D">("A");

  const [pqOptAText, setPqOptAText] = useState("");
  const [pqOptAImageUrl, setPqOptAImageUrl] = useState("");
  const [pqOptAImageFile, setPqOptAImageFile] = useState<File | null>(null);

  const [pqOptBText, setPqOptBText] = useState("");
  const [pqOptBImageUrl, setPqOptBImageUrl] = useState("");
  const [pqOptBImageFile, setPqOptBImageFile] = useState<File | null>(null);

  const [pqOptCText, setPqOptCText] = useState("");
  const [pqOptCImageUrl, setPqOptCImageUrl] = useState("");
  const [pqOptCImageFile, setPqOptCImageFile] = useState<File | null>(null);

  const [pqOptDText, setPqOptDText] = useState("");
  const [pqOptDImageUrl, setPqOptDImageUrl] = useState("");
  const [pqOptDImageFile, setPqOptDImageFile] = useState<File | null>(null);

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

      let lessonTitleText = "";
      // 2. Fetch Lesson title if lessonId exists
      if (lessonId) {
        const { data: lesson, error: lessonError } = await supabase
          .from("lessons")
          .select("title")
          .eq("id", lessonId)
          .single();
        if (lessonError) throw lessonError;
        setLessonTitle(lesson.title);
        lessonTitleText = lesson.title;
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
        // No quiz found, auto-create it with default settings so the admin can immediately add questions!
        const defaultTitle = lessonId 
          ? `واجب محاضرة: ${lessonTitleText || "الدرس"}` 
          : `الامتحان النهائي الشامل: ${course.title || "الكورس"}`;
          
        const payload = {
          course_id: courseId,
          lesson_id: lessonId || null,
          title: defaultTitle,
          type: (lessonId ? "quiz" : "final") as "quiz" | "final",
          passing_score: 50,
          is_active: true
        };

        const newQuiz = await saveQuiz(payload);
        setQuiz(newQuiz);
        setQuizTitle(newQuiz.title);
        setPassingScore(newQuiz.passing_score);
        setDuration("");
        setStartTime("");
        setEndTime("");
        setIsActive(newQuiz.is_active);
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



  // Import Questions Handlers
  async function openImportModal() {
    try {
      const { data: courses, error } = await supabase
        .from("courses")
        .select("id, title")
        .order("title");
      if (error) throw error;
      setImportCourses(courses || []);
      setShowImportModal(true);
    } catch (err: any) {
      alert("فشل تحميل قائمة الكورسات: " + err.message);
    }
  }

  async function handleImportCourseChange(courseId: string) {
    setSelectedImportCourseId(courseId);
    setSelectedImportQuizId("");
    setImportQuestions([]);
    setSelectedQuestionIds([]);
    if (!courseId) {
      setImportQuizzes([]);
      return;
    }
    try {
      const { data: quizzes, error } = await supabase
        .from("quizzes")
        .select("id, title, type, lesson_id")
        .eq("course_id", courseId)
        .order("title");
      if (error) throw error;
      setImportQuizzes(quizzes || []);
    } catch (err: any) {
      alert("فشل تحميل قائمة امتحانات الكورس: " + err.message);
    }
  }

  async function handleImportQuizChange(quizId: string) {
    setSelectedImportQuizId(quizId);
    setSelectedQuestionIds([]);
    if (!quizId) {
      setImportQuestions([]);
      return;
    }
    try {
      const { data: qData, error } = await supabase
        .from("questions")
        .select("*, options(*)")
        .eq("quiz_id", quizId);
      if (error) throw error;
      setImportQuestions(qData || []);
    } catch (err: any) {
      alert("فشل تحميل أسئلة الامتحان المحدد: " + err.message);
    }
  }

  async function handleExecuteImport() {
    if (!quiz || selectedQuestionIds.length === 0) return;
    try {
      setIsImporting(true);
      setImportProgress({ current: 0, total: selectedQuestionIds.length });
      
      const sourceQuestionsToImport = selectedQuestionIds
        .map((id) => importQuestions.find((q) => q.id === id))
        .filter(Boolean);

      if (sourceQuestionsToImport.length === 0) {
        alert("لم يتم العثور على الأسئلة المحددة للاستيراد.");
        setIsImporting(false);
        return;
      }

      const result = await bulkImportQuestions(
        quiz.id,
        sourceQuestionsToImport,
        (current, total) => {
          setImportProgress({ current, total });
        }
      );
      
      alert(`🎉 تم استيراد عدد ${result.count} سؤال بنجاح بدون أي أخطاء!`);
      setShowImportModal(false);
      setSelectedImportCourseId("");
      setImportQuizzes([]);
      setSelectedImportQuizId("");
      setImportQuestions([]);
      setSelectedQuestionIds([]);
      setImportProgress({ current: 0, total: 0 });
      loadData();
    } catch (err: any) {
      console.error("خطأ استيراد الأسئلة:", err);
      const errMsg = err?.message || err?.error_description || (typeof err === "object" ? JSON.stringify(err) : String(err));
      alert("حدث خطأ أثناء استيراد الأسئلة: " + errMsg);
    } finally {
      setIsImporting(false);
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

  // =========================================================================
  // Passage Group Handlers
  // =========================================================================

  function openAddPassageModal() {
    setPassageModalMode("add");
    setPassageGroupId("passage_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7));
    setPassageTitle("");
    setPassageText("");
    setPassageQuestions([]);
    setDeletedPassageQIds([]);
    setShowPassageQForm(false);
    setEditingPassageQIndex(null);
    setShowPassageModal(true);
  }

  function openEditPassageModal(passageGroup: {
    passageId: string;
    passageTitle: string;
    passageText: string;
    questions: any[];
  }) {
    setPassageModalMode("edit");
    setPassageGroupId(passageGroup.passageId);
    setPassageTitle(passageGroup.passageTitle || "");
    setPassageText(passageGroup.passageText || "");

    const mappedQuestions = (passageGroup.questions || []).map((q: any) => {
      const optA = q.options?.find((o: any) => o.option_letter === "A");
      const optB = q.options?.find((o: any) => o.option_letter === "B");
      const optC = q.options?.find((o: any) => o.option_letter === "C");
      const optD = q.options?.find((o: any) => o.option_letter === "D");
      return {
        id: q.id,
        question_text: q.question_text || "",
        question_image: q.question_image || "",
        correct_option: (q.correct_option || "A") as "A" | "B" | "C" | "D",
        options: [
          { option_letter: "A" as const, option_text: optA?.option_text || "", option_image: optA?.option_image || "" },
          { option_letter: "B" as const, option_text: optB?.option_text || "", option_image: optB?.option_image || "" },
          { option_letter: "C" as const, option_text: optC?.option_text || "", option_image: optC?.option_image || "" },
          { option_letter: "D" as const, option_text: optD?.option_text || "", option_image: optD?.option_image || "" },
        ]
      };
    });

    setPassageQuestions(mappedQuestions);
    setDeletedPassageQIds([]);
    setShowPassageQForm(false);
    setEditingPassageQIndex(null);
    setShowPassageModal(true);
  }

  function openAddPassageQuestion() {
    setEditingPassageQIndex(null);
    setPqText("");
    setPqImageUrl("");
    setPqImageFile(null);
    setPqCorrectOption("A");

    setPqOptAText(""); setPqOptAImageUrl(""); setPqOptAImageFile(null);
    setPqOptBText(""); setPqOptBImageUrl(""); setPqOptBImageFile(null);
    setPqOptCText(""); setPqOptCImageUrl(""); setPqOptCImageFile(null);
    setPqOptDText(""); setPqOptDImageUrl(""); setPqOptDImageFile(null);

    setShowPassageQForm(true);
  }

  function openEditPassageQuestion(index: number) {
    const q = passageQuestions[index];
    if (!q) return;

    setEditingPassageQIndex(index);
    setPqText(q.question_text || "");
    setPqImageUrl(q.question_image || "");
    setPqImageFile(q.question_image_file || null);
    setPqCorrectOption(q.correct_option || "A");

    const optA = q.options?.find((o) => o.option_letter === "A");
    const optB = q.options?.find((o) => o.option_letter === "B");
    const optC = q.options?.find((o) => o.option_letter === "C");
    const optD = q.options?.find((o) => o.option_letter === "D");

    setPqOptAText(optA?.option_text || ""); setPqOptAImageUrl(optA?.option_image || ""); setPqOptAImageFile(optA?.option_image_file || null);
    setPqOptBText(optB?.option_text || ""); setPqOptBImageUrl(optB?.option_image || ""); setPqOptBImageFile(optB?.option_image_file || null);
    setPqOptCText(optC?.option_text || ""); setPqOptCImageUrl(optC?.option_image || ""); setPqOptCImageFile(optC?.option_image_file || null);
    setPqOptDText(optD?.option_text || ""); setPqOptDImageUrl(optD?.option_image || ""); setPqOptDImageFile(optD?.option_image_file || null);

    setShowPassageQForm(true);
  }

  function handleSavePassageQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!pqText.trim() && !pqImageUrl && !pqImageFile) {
      alert("يرجى كتابة نص السؤال أو رفع صورة له.");
      return;
    }

    const newQuestionItem = {
      id: editingPassageQIndex !== null ? passageQuestions[editingPassageQIndex]?.id : undefined,
      question_text: pqText.trim(),
      question_image: pqImageUrl,
      question_image_file: pqImageFile,
      correct_option: pqCorrectOption,
      options: [
        { option_letter: "A" as const, option_text: pqOptAText.trim(), option_image: pqOptAImageUrl, option_image_file: pqOptAImageFile },
        { option_letter: "B" as const, option_text: pqOptBText.trim(), option_image: pqOptBImageUrl, option_image_file: pqOptBImageFile },
        { option_letter: "C" as const, option_text: pqOptCText.trim(), option_image: pqOptCImageUrl, option_image_file: pqOptCImageFile },
        { option_letter: "D" as const, option_text: pqOptDText.trim(), option_image: pqOptDImageUrl, option_image_file: pqOptDImageFile },
      ]
    };

    if (editingPassageQIndex !== null) {
      const updated = [...passageQuestions];
      updated[editingPassageQIndex] = newQuestionItem;
      setPassageQuestions(updated);
    } else {
      setPassageQuestions([...passageQuestions, newQuestionItem]);
    }

    setShowPassageQForm(false);
    setEditingPassageQIndex(null);
  }

  function handleDeletePassageQuestion(index: number) {
    const q = passageQuestions[index];
    if (q?.id) {
      setDeletedPassageQIds((prev) => [...prev, q.id!]);
    }
    setPassageQuestions(passageQuestions.filter((_, i) => i !== index));
    if (editingPassageQIndex === index) {
      setShowPassageQForm(false);
      setEditingPassageQIndex(null);
    }
  }

  function handleMovePassageQuestion(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= passageQuestions.length) return;
    const updated = [...passageQuestions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setPassageQuestions(updated);
  }

  async function handleSavePassageGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!quiz) return;

    if (!passageText.trim()) {
      alert("يرجى إدخال نص قطعة القراءة (Reading Passage).");
      return;
    }

    if (passageQuestions.length === 0) {
      alert("يرجى إضافة سؤال واحد على الأقل مرتبط بهذه القطعة قبل الحفظ.");
      return;
    }

    try {
      setIsSavingPassage(true);

      const preparedQuestions: any[] = [];
      for (let i = 0; i < passageQuestions.length; i++) {
        const q = passageQuestions[i];
        let finalQImg = q.question_image || "";
        if (q.question_image_file) {
          finalQImg = await uploadQuizImage(q.question_image_file);
        }

        const preparedOpts: any[] = [];
        for (const opt of q.options) {
          let finalOptImg = opt.option_image || "";
          if (opt.option_image_file) {
            finalOptImg = await uploadQuizImage(opt.option_image_file);
          }
          preparedOpts.push({
            option_letter: opt.option_letter,
            option_text: opt.option_text || null,
            option_image: finalOptImg || null,
          });
        }

        preparedQuestions.push({
          id: q.id,
          question_text: q.question_text,
          question_image: finalQImg || null,
          correct_option: q.correct_option,
          order_num: i + 1,
          options: preparedOpts,
        });
      }

      await savePassageGroup(
        quiz.id,
        {
          id: passageGroupId,
          title: passageTitle.trim() || undefined,
          text: passageText.trim(),
        },
        preparedQuestions,
        deletedPassageQIds
      );

      alert("تم حفظ قطعة القراءة والأسئلة المرتبطة بها بنجاح 🎉");
      setShowPassageModal(false);
      loadData();
    } catch (err: any) {
      alert("فشل حفظ قطعة القراءة: " + err.message);
    } finally {
      setIsSavingPassage(false);
    }
  }

  async function handleDeletePassageGroup(passageId: string) {
    if (!confirm("هل أنت متأكد من حذف قطعة القراءة هذه وجميع الأسئلة التابعة لها نهائياً؟")) return;
    try {
      await deletePassageGroup(passageId);
      alert("تم حذف قطعة القراءة بنجاح.");
      loadData();
    } catch (err: any) {
      alert("فشل حذف قطعة القراءة: " + err.message);
    }
  }

  // Helper to group flat questions into standalone questions or passage groups
  const groupedItems = (() => {
    const groups: Array<
      | {
          type: "single";
          question: any;
        }
      | {
          type: "passage";
          passageId: string;
          passageTitle: string;
          passageText: string;
          questions: any[];
        }
    > = [];

    const processedPassageIds = new Set<string>();

    for (const q of questions) {
      if (q.passage_id && q.passage_text) {
        if (!processedPassageIds.has(q.passage_id)) {
          processedPassageIds.add(q.passage_id);
          const passageQs = questions.filter((item) => item.passage_id === q.passage_id);
          groups.push({
            type: "passage",
            passageId: q.passage_id,
            passageTitle: q.passage_title || "قطعة قراءة",
            passageText: q.passage_text,
            questions: passageQs,
          });
        }
      } else {
        groups.push({
          type: "single",
          question: q,
        });
      }
    }

    return groups;
  })();

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
                  <div className="flex flex-wrap justify-between items-center gap-3 px-1">
                    <h3 className="font-extrabold text-[#2D2B7A] text-lg">الأسئلة الحالية ({questions.length} سؤال)</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={openImportModal}
                        className="bg-[#7D79F1] hover:bg-[#655EF0] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        📥 استيراد أسئلة
                      </button>
                      <button
                        onClick={openAddPassageModal}
                        className="bg-[#5B57E6] hover:bg-[#4E49D8] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <BookOpen size={15} />
                        📖 إضافة قطعة قراءة
                      </button>
                      <button
                        onClick={openAddQModal}
                        className="bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus size={15} />
                        إضافة سؤال عادي (MCQ)
                      </button>
                    </div>
                  </div>

                  {questions.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 border text-center text-gray-400 font-medium">
                      لا توجد أسئلة مضافة في هذا الامتحان حالياً. اضغط "إضافة سؤال عادي" أو "إضافة قطعة قراءة" للبدء.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groupedItems.map((group, groupIdx) => {
                        if (group.type === "single") {
                          const q = group.question;
                          return (
                            <div key={q.id} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 relative group hover:border-[#7D79F1]/40 transition">
                              {/* Actions */}
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
                                  سؤال اختياري #{groupIdx + 1}
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
                          );
                        } else {
                          // Reading Passage Group
                          return (
                            <div key={group.passageId} className="bg-gradient-to-b from-[#FAF9FF] to-white p-6 rounded-3xl border-2 border-[#7D79F1]/40 shadow-md space-y-6">
                              {/* Passage Header */}
                              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#7D79F1]/20 pb-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-[#7D79F1] text-white px-3.5 py-1 rounded-full text-xs font-black shadow-sm flex items-center gap-1.5">
                                      <BookOpen size={14} />
                                      مجموعة قطعة قراءة ({group.questions.length} أسئلة)
                                    </span>
                                    {group.passageTitle && (
                                      <span className="text-sm font-bold text-[#2D2B7A]">
                                        {group.passageTitle}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openEditPassageModal(group)}
                                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit2 size={13} />
                                    تعديل القطعة وأسئلتها
                                  </button>
                                  <button
                                    onClick={() => handleDeletePassageGroup(group.passageId)}
                                    className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                    حذف القطعة
                                  </button>
                                </div>
                              </div>

                              {/* Passage Content Box */}
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-[#7D79F1]">📖 نص قطعة القراءة (Reading Passage):</label>
                                <div className="p-4 bg-white rounded-2xl border border-purple-100 text-gray-800 text-sm leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-sans text-left" dir="ltr">
                                  {group.passageText}
                                </div>
                              </div>

                              {/* Nested Questions in this Passage */}
                              <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black text-[#2D2B7A] uppercase tracking-wider">
                                    الأسئلة المرتبطة بهذه القطعة ({group.questions.length})
                                  </h4>
                                </div>

                                <div className="space-y-3">
                                  {group.questions.map((pq: any, pqIdx: number) => (
                                    <div key={pq.id} className="bg-white p-4 rounded-2xl border border-purple-100/80 shadow-xs space-y-3">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-purple-100 text-[#7D79F1] font-bold text-xs flex items-center justify-center">
                                            {pqIdx + 1}
                                          </span>
                                          <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                                            الإجابة: {pq.correct_option}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => openEditPassageModal(group)}
                                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer text-xs"
                                            title="تعديل السؤال عبر القطعة"
                                          >
                                            <Edit2 size={13} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteQ(pq.id)}
                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer text-xs"
                                            title="حذف السؤال"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>

                                      {pq.question_text && (
                                        <p className="text-sm font-bold text-[#2D2B7A] pr-1">{pq.question_text}</p>
                                      )}

                                      {/* Options preview */}
                                      <div className="grid md:grid-cols-2 gap-2 pt-1 text-xs">
                                        {pq.options?.map((opt: any) => {
                                          const isCorrect = pq.correct_option === opt.option_letter;
                                          return (
                                            <div 
                                              key={opt.id} 
                                              className={`p-2 rounded-xl border flex items-center gap-2 ${
                                                isCorrect ? "bg-green-50/50 border-green-300 font-bold text-green-800" : "bg-gray-50/50 border-gray-100 text-gray-600"
                                              }`}
                                            >
                                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                                isCorrect ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                                              }`}>
                                                {opt.option_letter}
                                              </span>
                                              <span>{opt.option_text || "[صورة]"}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          );
                        }
                      })}
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

      {/* READING PASSAGE MODAL (Add / Edit Reading Passage and its linked questions) */}
      {showPassageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl max-h-[92vh] overflow-y-auto border border-gray-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col" dir="rtl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h2 className="text-lg font-extrabold text-[#2D2B7A] flex items-center gap-2">
                <BookOpen size={20} className="text-[#7D79F1]" />
                {passageModalMode === "add" ? "📖 إنشاء قطعة قراءة جديدة ومجموعة أسئلة" : "📝 تعديل قطعة القراءة والأسئلة المرتبطة بها"}
              </h2>
              <button
                onClick={() => setShowPassageModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSavePassageGroup} className="p-6 space-y-6 flex-1 overflow-y-auto">
              
              {/* Passage Title Input (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">عنوان القطعة (اختياري - مثل: Reading Passage 1: The Nile River)</label>
                <input
                  type="text"
                  placeholder="مثال: Reading Comprehension 1"
                  className="w-full px-4 py-2.5 rounded-xl border outline-none text-[#2D2B7A] focus:border-[#7D79F1] text-sm font-semibold"
                  value={passageTitle}
                  onChange={(e) => setPassageTitle(e.target.value)}
                />
              </div>

              {/* Passage Content Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#7D79F1]">
                    نص قطعة القراءة (Reading Passage) *
                  </label>
                  <span className="text-[11px] text-gray-400">يدعم تنسيق الفقرات باللغة الإنجليزية والأسطر المتباعدة</span>
                </div>
                <textarea
                  rows={8}
                  required
                  placeholder="Paste or write the reading passage here in English with paragraphs..."
                  className="w-full p-4 rounded-2xl border-2 border-purple-100 outline-none text-gray-800 focus:border-[#7D79F1] text-sm font-sans leading-relaxed whitespace-pre-wrap text-left bg-purple-50/10"
                  dir="ltr"
                  value={passageText}
                  onChange={(e) => setPassageText(e.target.value)}
                />
              </div>

              {/* Passage Questions Section */}
              <div className="border-t-2 border-gray-100 pt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-[#2D2B7A]">
                      الأسئلة المرتبطة بهذه القطعة ({passageQuestions.length})
                    </h3>
                    <p className="text-xs text-gray-400">أضف أسئلة MCQ يتم حلها بالرجوع لهذه القطعة</p>
                  </div>
                  {!showPassageQForm && (
                    <button
                      type="button"
                      onClick={openAddPassageQuestion}
                      className="bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus size={15} />
                      + إضافة سؤال للقطعة
                    </button>
                  )}
                </div>

                {/* Inline Question Sub-Form */}
                {showPassageQForm && (
                  <div className="p-5 rounded-2xl border-2 border-[#7D79F1] bg-[#F8F7FF] space-y-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                      <h4 className="text-xs font-black text-[#2D2B7A]">
                        {editingPassageQIndex !== null ? `📝 تعديل السؤال #${editingPassageQIndex + 1}` : "➕ إضافة سؤال جديد للقطعة"}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPassageQForm(false);
                          setEditingPassageQIndex(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Question Text & optional image */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-600">نص السؤال *</label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border bg-white outline-none text-[#2D2B7A] focus:border-[#7D79F1] text-xs font-medium"
                        placeholder="مثال: What is the main purpose of paragraph 2?"
                        value={pqText}
                        onChange={(e) => setPqText(e.target.value)}
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400">صورة توضيحية للسؤال (اختياري)</label>
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full text-xs text-gray-500 border bg-white p-1.5 rounded-lg"
                            onChange={(e) => setPqImageFile(e.target.files?.[0] || null)}
                          />
                        </div>
                        {pqImageUrl && (
                          <div className="w-12 h-12 rounded-lg border overflow-hidden relative shrink-0">
                            <img src={pqImageUrl} alt="Graphic" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setPqImageUrl("")} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-full"><X size={8} /></button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Choices A, B, C, D */}
                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-bold text-gray-600">الاختيارات الأربعة:</label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {/* Option A */}
                        <div className="p-3 border rounded-xl bg-white space-y-2">
                          <span className="text-xs font-extrabold text-[#7D79F1]">اختيار A</span>
                          <input
                            type="text"
                            placeholder="نص الاختيار A"
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs text-[#2D2B7A]"
                            value={pqOptAText}
                            onChange={(e) => setPqOptAText(e.target.value)}
                          />
                        </div>
                        {/* Option B */}
                        <div className="p-3 border rounded-xl bg-white space-y-2">
                          <span className="text-xs font-extrabold text-[#7D79F1]">اختيار B</span>
                          <input
                            type="text"
                            placeholder="نص الاختيار B"
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs text-[#2D2B7A]"
                            value={pqOptBText}
                            onChange={(e) => setPqOptBText(e.target.value)}
                          />
                        </div>
                        {/* Option C */}
                        <div className="p-3 border rounded-xl bg-white space-y-2">
                          <span className="text-xs font-extrabold text-[#7D79F1]">اختيار C</span>
                          <input
                            type="text"
                            placeholder="نص الاختيار C"
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs text-[#2D2B7A]"
                            value={pqOptCText}
                            onChange={(e) => setPqOptCText(e.target.value)}
                          />
                        </div>
                        {/* Option D */}
                        <div className="p-3 border rounded-xl bg-white space-y-2">
                          <span className="text-xs font-extrabold text-[#7D79F1]">اختيار D</span>
                          <input
                            type="text"
                            placeholder="نص الاختيار D"
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs text-[#2D2B7A]"
                            value={pqOptDText}
                            onChange={(e) => setPqOptDText(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Correct Option Select */}
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-gray-600 mb-1">الإجابة الصحيحة لهذا السؤال:</label>
                      <select
                        className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-bold text-[#2D2B7A]"
                        value={pqCorrectOption}
                        onChange={(e) => setPqCorrectOption(e.target.value as any)}
                      >
                        <option value="A">الاختيار A هو الصحيح</option>
                        <option value="B">الاختيار B هو الصحيح</option>
                        <option value="C">الاختيار C هو الصحيح</option>
                        <option value="D">الاختيار D هو الصحيح</option>
                      </select>
                    </div>

                    {/* Sub-form action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleSavePassageQuestion}
                        className="flex-1 py-2.5 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold text-xs transition"
                      >
                        ✓ حفظ السؤال في القطعة
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPassageQForm(false);
                          setEditingPassageQIndex(null);
                        }}
                        className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs transition"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Questions currently added to this passage */}
                {passageQuestions.length === 0 && !showPassageQForm ? (
                  <div className="p-8 border-2 border-dashed border-purple-200 rounded-2xl text-center text-gray-400 text-xs bg-purple-50/10 space-y-2">
                    <p>لا توجد أسئلة مضافة لهذه القطعة بعد.</p>
                    <button
                      type="button"
                      onClick={openAddPassageQuestion}
                      className="text-[#7D79F1] font-bold hover:underline"
                    >
                      + اضغط هنا لإضافة أول سؤال للقطعة
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {passageQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-purple-100 bg-white shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-[#7D79F1] font-bold text-[11px] flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-[#2D2B7A] line-clamp-1">
                              {q.question_text || "[سؤال بصورة]"}
                            </span>
                            <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                              الإجابة: {q.correct_option}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMovePassageQuestion(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              title="تحريك لأعلى"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePassageQuestion(idx, "down")}
                              disabled={idx === passageQuestions.length - 1}
                              className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              title="تحريك لأسفل"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditPassageQuestion(idx)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 text-xs"
                              title="تعديل السؤال"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePassageQuestion(idx)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 text-xs"
                              title="حذف السؤال"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Quick options view */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px] text-gray-500">
                          {q.options.map((opt) => (
                            <div
                              key={opt.option_letter}
                              className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${
                                q.correct_option === opt.option_letter ? "bg-green-50/60 border-green-300 font-bold text-green-800" : "bg-gray-50/60 border-gray-100"
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[9px] font-bold">
                                {opt.option_letter}
                              </span>
                              <span className="truncate">{opt.option_text || "[صورة]"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="flex gap-3 pt-6 border-t shrink-0">
                <button
                  type="submit"
                  disabled={isSavingPassage}
                  className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isSavingPassage ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  حفظ قطعة القراءة والأسئلة المرتبطة بها
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassageModal(false)}
                  className="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-bold transition text-xs border cursor-pointer text-center"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* IMPORT QUESTIONS FROM OTHER QUIZ/EXAM MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col" dir="rtl">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h2 className="text-lg font-extrabold text-[#2D2B7A] flex items-center gap-2">
                📥 استيراد أسئلة من تقييم آخر
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* Progress Bar (Visible during bulk import) */}
              {isImporting && (
                <div className="space-y-2 bg-purple-50 p-4 rounded-2xl border border-purple-150 animate-in fade-in duration-200">
                  <div className="flex justify-between text-xs font-bold text-[#7D79F1]">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="animate-spin text-[#7D79F1]" size={14} />
                      جاري استيراد الأسئلة بأمان وبدون انقطاع...
                    </span>
                    <span>
                      {importProgress.current} / {importProgress.total} ({Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#7D79F1] to-[#655EF0] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Select Course */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500">اختر الكورس المصدر</label>
                <select
                  disabled={isImporting}
                  className="w-full px-4 py-2.5 rounded-xl border outline-none text-[#2D2B7A] font-bold text-sm bg-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  value={selectedImportCourseId}
                  onChange={(e) => handleImportCourseChange(e.target.value)}
                >
                  <option value="">-- اختر الكورس --</option>
                  {importCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Exam/Quiz */}
              {selectedImportCourseId && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="block text-xs font-bold text-gray-500">اختر التقييم (امتحان أو واجب)</label>
                  <select
                    disabled={isImporting}
                    className="w-full px-4 py-2.5 rounded-xl border outline-none text-[#2D2B7A] font-bold text-sm bg-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    value={selectedImportQuizId}
                    onChange={(e) => handleImportQuizChange(e.target.value)}
                  >
                    <option value="">-- اختر الامتحان / الواجب --</option>
                    {importQuizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title} ({q.type === "quiz" ? "واجب محاضرة" : "امتحان شامل"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Questions Checkbox List */}
              {selectedImportQuizId && (
                <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                    <span>الأسئلة المتوفرة ({importQuestions.length})</span>
                    {!isImporting && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedQuestionIds(importQuestions.map(q => q.id))}
                          className="text-[#7D79F1] hover:underline"
                        >
                          تحديد الكل ({importQuestions.length})
                        </button>
                        <span>|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedQuestionIds([])}
                          className="text-gray-400 hover:underline"
                        >
                          إلغاء التحديد
                        </button>
                      </div>
                    )}
                  </div>

                  {importQuestions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs border rounded-xl bg-gray-50/50">
                      لا توجد أسئلة مضافة في هذا التقييم بعد.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto border p-3 rounded-xl bg-gray-50/50">
                      {importQuestions.map((q, qIdx) => {
                        const isSelected = selectedQuestionIds.includes(q.id);
                        return (
                          <label
                            key={q.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border bg-white transition cursor-pointer select-none text-xs ${
                              isSelected ? "border-purple-300 bg-purple-50/10" : "border-gray-150"
                            } ${isImporting ? "opacity-60 pointer-events-none" : ""}`}
                          >
                            <input
                              type="checkbox"
                              disabled={isImporting}
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                                } else {
                                  setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== q.id));
                                }
                              }}
                              className="w-4 h-4 text-[#7D79F1] focus:ring-[#7D79F1]/20 border-gray-300 rounded cursor-pointer shrink-0 mt-0.5"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#2D2B7A]">
                                  السؤال {qIdx + 1}
                                </span>
                                {q.passage_text && (
                                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-blue-150">
                                    <BookOpen size={10} />
                                    {q.passage_title || "قطعة قراءة"}
                                  </span>
                                )}
                              </div>
                              <span className="text-gray-700 font-medium leading-relaxed block line-clamp-2">
                                {q.question_text || "[سؤال يحتوي على صورة فقط]"}
                              </span>
                              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                <span className="text-green-600 font-bold">
                                  الإجابة: {q.correct_option}
                                </span>
                                <span>•</span>
                                <span>عدد الاختيارات: {q.options?.length || 4}</span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Actions Footer */}
            <div className="flex gap-3 p-6 border-t shrink-0">
              <button
                onClick={handleExecuteImport}
                disabled={isImporting || selectedQuestionIds.length === 0}
                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-md"
              >
                {isImporting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                {isImporting
                  ? `جاري استيراد (${importProgress.current}/${importProgress.total})...`
                  : `استيراد الأسئلة المحددة (${selectedQuestionIds.length})`}
              </button>
              <button
                type="button"
                disabled={isImporting}
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedImportCourseId("");
                  setImportQuizzes([]);
                  setSelectedImportQuizId("");
                  setImportQuestions([]);
                  setSelectedQuestionIds([]);
                }}
                className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-500 rounded-xl font-bold transition text-xs border cursor-pointer text-center"
              >
                إلغاء
              </button>
            </div>

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
