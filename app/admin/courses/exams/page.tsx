"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  getAdminQuizzesForCourse, 
  getAdminFinalExamsForCourse,
  getSingleQuizResultsReport,
  checkQuizHasAttempts,
  duplicateQuiz,
  toggleQuizActive,
  saveQuiz, 
  saveQuestion, 
  deleteQuestion, 
  uploadQuizImage, 
  getCourseStudentPerformance,
  savePassageGroup,
  deletePassageGroup,
  bulkImportQuestions,
  deleteQuiz
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
  ArrowDown,
  Copy,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Eye,
  EyeOff,
  Layers,
  BarChart3,
  Calendar,
  Filter
} from "lucide-react";
import Link from "next/link";

function ExamsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId"); // if provided, we are managing a lesson quiz
  const initialQuizId = searchParams.get("quizId");
  const initialTab = searchParams.get("tab");

  const supabase = createClient();

  // Mode: "exams_list" | "editor" | "results"
  const [viewMode, setViewMode] = useState<"exams_list" | "editor" | "results">("exams_list");
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(initialQuizId || null);

  // Page level states
  const [courseTitle, setCourseTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [finalExamsList, setFinalExamsList] = useState<any[]>([]);
  const [loadingExamsList, setLoadingExamsList] = useState(false);

  // Active Quiz Editor states
  const [quiz, setQuiz] = useState<any>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [examAttemptsCount, setExamAttemptsCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"questions" | "students">("questions");

  // Add Final Exam Modal States
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamDescription, setNewExamDescription] = useState("");
  const [newExamPassingScore, setNewExamPassingScore] = useState(50);
  const [newExamDuration, setNewExamDuration] = useState("");
  const [newExamStartTime, setNewExamStartTime] = useState("");
  const [newExamEndTime, setNewExamEndTime] = useState("");
  const [newExamIsActive, setNewExamIsActive] = useState(true);
  const [newExamShowSolutions, setNewExamShowSolutions] = useState(false);
  const [isCreatingExam, setIsCreatingExam] = useState(false);

  // Single Exam Results Report state
  const [resultsReport, setResultsReport] = useState<any | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsSearchTerm, setResultsSearchTerm] = useState("");
  const [resultsFilterStatus, setResultsFilterStatus] = useState<"all" | "passed" | "failed">("all");
  const [selectedStudentAttemptsModal, setSelectedStudentAttemptsModal] = useState<any | null>(null);

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

  // Quiz Form states in editor
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [passingScore, setPassingScore] = useState(50);
  const [duration, setDuration] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showSolutions, setShowSolutions] = useState(false);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  // Questions List
  const [questions, setQuestions] = useState<any[]>([]);

  // Question Form / Modal states
  const [showQModal, setShowQModal] = useState(false);
  const [qModalMode, setQModalMode] = useState<"add" | "edit">("add");
  const [selectedQId, setSelectedQId] = useState<string | null>(null);
  const [qType, setQType] = useState<"mcq" | "paragraph">("mcq");
  const [minWords, setMinWords] = useState<number>(150);
  const [maxWords, setMaxWords] = useState<number>(180);
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

  // Students performance report state (Course-wide)
  const [studentPerformance, setStudentPerformance] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Load Course and Lesson titles
  async function loadCourseInfo() {
    if (!courseId) return;
    try {
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .single();
      if (courseError) throw courseError;
      setCourseTitle(course.title);

      if (lessonId) {
        const { data: lesson, error: lessonError } = await supabase
          .from("lessons")
          .select("title")
          .eq("id", lessonId)
          .single();
        if (lessonError) throw lessonError;
        setLessonTitle(lesson.title);
      }
    } catch (err) {
      console.error("Error loading course info:", err);
    }
  }

  // Load Final Exams List for this Course
  async function loadFinalExamsList() {
    if (!courseId) return;
    try {
      setLoadingExamsList(true);
      const exams = await getAdminFinalExamsForCourse(courseId);
      setFinalExamsList(exams);
    } catch (err) {
      console.error("Error loading final exams list:", err);
    } finally {
      setLoadingExamsList(false);
    }
  }

  // Load Specific Quiz into Editor
  async function loadQuizDetails(targetQuizId?: string) {
    if (!courseId) return;
    try {
      setLoadingQuiz(true);

      let activeQuiz: any = null;

      if (targetQuizId) {
        const { data, error } = await supabase
          .from("quizzes")
          .select("*, questions(*, options(*))")
          .eq("id", targetQuizId)
          .single();
        if (error) throw error;
        activeQuiz = data;
      } else if (lessonId) {
        const { data: quizzes, error } = await supabase
          .from("quizzes")
          .select("*, questions(*, options(*))")
          .eq("course_id", courseId)
          .eq("lesson_id", lessonId);
        if (error) throw error;
        activeQuiz = quizzes && quizzes.length > 0 ? quizzes[0] : null;
      }

      if (activeQuiz) {
        setQuiz(activeQuiz);
        setSelectedQuizId(activeQuiz.id);
        setQuizTitle(activeQuiz.title);
        setQuizDescription(activeQuiz.description || "");
        setPassingScore(activeQuiz.passing_score);
        setDuration(activeQuiz.duration ? String(activeQuiz.duration) : "");
        setStartTime(activeQuiz.start_time ? activeQuiz.start_time.substring(0, 16) : "");
        setEndTime(activeQuiz.end_time ? activeQuiz.end_time.substring(0, 16) : "");
        setIsActive(activeQuiz.is_active);
        setShowSolutions(Boolean(activeQuiz.show_solutions));

        // Sort questions
        const sortedQuestions = (activeQuiz.questions || []).sort((a: any, b: any) => {
          const ordA = a.order_num ?? (a.created_at ? new Date(a.created_at).getTime() : 0);
          const ordB = b.order_num ?? (b.created_at ? new Date(b.created_at).getTime() : 0);
          return ordA - ordB;
        });
        setQuestions(sortedQuestions);

        // Check attempts count for safety guard
        const attInfo = await checkQuizHasAttempts(activeQuiz.id);
        setExamAttemptsCount(attInfo.count);
      } else if (lessonId) {
        // Auto-create lesson quiz if missing
        const payload = {
          course_id: courseId,
          lesson_id: lessonId,
          title: `واجب محاضرة: ${lessonTitle || "الدرس"}`,
          type: "quiz" as "quiz",
          passing_score: 50,
          is_active: true,
          show_solutions: false,
        };
        const newQuiz = await saveQuiz(payload);
        setQuiz(newQuiz);
        setSelectedQuizId(newQuiz.id);
        setQuizTitle(newQuiz.title);
        setQuizDescription("");
        setPassingScore(newQuiz.passing_score);
        setDuration("");
        setStartTime("");
        setEndTime("");
        setIsActive(newQuiz.is_active);
        setShowSolutions(false);
        setQuestions([]);
        setExamAttemptsCount(0);
      }
    } catch (error) {
      console.error("فشل جلب تفاصيل الامتحان:", error);
    } finally {
      setLoadingQuiz(false);
    }
  }

  // Load Results Report for a specific exam
  async function loadQuizResults(targetQuizId: string) {
    try {
      setLoadingResults(true);
      const report = await getSingleQuizResultsReport(targetQuizId);
      setResultsReport(report);
      setSelectedQuizId(targetQuizId);
      setViewMode("results");
    } catch (err: any) {
      alert("فشل تحميل تقرير نتائج الامتحان: " + err.message);
    } finally {
      setLoadingResults(false);
    }
  }

  // Load students performance list (for course-wide students tab)
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

  // Initialize view
  useEffect(() => {
    loadCourseInfo();

    if (lessonId) {
      setViewMode("editor");
      loadQuizDetails();
    } else if (initialQuizId) {
      if (initialTab === "results") {
        loadQuizResults(initialQuizId);
      } else {
        setViewMode("editor");
        loadQuizDetails(initialQuizId);
      }
      loadFinalExamsList();
    } else {
      setViewMode("exams_list");
      loadFinalExamsList();
    }
  }, [courseId, lessonId, initialQuizId]);

  useEffect(() => {
    if (activeTab === "students" && viewMode === "editor") {
      loadStudentPerformance();
    }
  }, [activeTab, viewMode]);

  // Handle Create New Final Exam
  async function handleCreateNewExam(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    if (!newExamTitle.trim()) {
      alert("يرجى إدخال اسم الامتحان.");
      return;
    }

    try {
      setIsCreatingExam(true);
      const payload = {
        course_id: courseId,
        lesson_id: null,
        title: newExamTitle.trim(),
        description: newExamDescription.trim() || null,
        type: "final" as "final",
        passing_score: newExamPassingScore,
        duration: newExamDuration ? Number(newExamDuration) : null,
        start_time: newExamStartTime ? new Date(newExamStartTime).toISOString() : null,
        end_time: newExamEndTime ? new Date(newExamEndTime).toISOString() : null,
        is_active: newExamIsActive,
        show_solutions: newExamShowSolutions,
      };

      const created = await saveQuiz(payload);
      alert("🎉 تم إنشاء الامتحان النهائي بنجاح! جاري فتح محرر الأسئلة...");

      setShowAddExamModal(false);
      setNewExamTitle("");
      setNewExamDescription("");
      setNewExamDuration("");
      setNewExamStartTime("");
      setNewExamEndTime("");

      // Refresh list & switch to editor for the new exam
      await loadFinalExamsList();
      setSelectedQuizId(created.id);
      setViewMode("editor");
      loadQuizDetails(created.id);
    } catch (err: any) {
      alert("فشل إنشاء الامتحان: " + err.message);
    } finally {
      setIsCreatingExam(false);
    }
  }

  // Handle Duplicate Exam
  async function handleDuplicateExam(examId: string, examTitle: string) {
    const customTitle = prompt(`أدخل اسم النسخة الجديدة من الامتحان:`, `${examTitle} (نسخة جديدة)`);
    if (customTitle === null) return;

    try {
      setLoadingExamsList(true);
      const duplicated = await duplicateQuiz(examId, customTitle.trim() || undefined);
      alert(`🎉 تم تكرار الامتحان بنجاح كنسخة جديدة (مسودة)! ID الامتحان الجديد: ${duplicated.id}`);
      await loadFinalExamsList();
    } catch (err: any) {
      alert("فشل تكرار الامتحان: " + err.message);
    } finally {
      setLoadingExamsList(false);
    }
  }

  // Handle Toggle Exam Status (Publish / Draft)
  async function handleToggleExamStatus(examId: string, currentIsActive: boolean) {
    try {
      await toggleQuizActive(examId, !currentIsActive);
      await loadFinalExamsList();
    } catch (err: any) {
      alert("فشل تعديل حالة تفعيل الامتحان: " + err.message);
    }
  }

  // Handle Delete Exam
  async function handleDeleteExam(examId: string, examTitle: string) {
    const attCheck = await checkQuizHasAttempts(examId);
    if (attCheck.hasAttempts) {
      const confirmForce = confirm(
        `⚠️ تحذير شديد: هذا الامتحان "${examTitle}" يحتوي على (${attCheck.count}) محاولة مسجلة لطلاب!\n\nإذا قمت بالحذف، ستفقد هذه الدرجات والمحاولات نهائياً.\n\nهل أنت متأكد تماماً من رغبتك في الحذف النهائي؟`
      );
      if (!confirmForce) return;
    } else {
      if (!confirm(`هل أنت متأكد من حذف الامتحان النهائي "${examTitle}" وجميع أسئلته؟`)) return;
    }

    try {
      await deleteQuiz(examId);
      alert("تم حذف الامتحان بنجاح.");
      if (selectedQuizId === examId) {
        setSelectedQuizId(null);
        setViewMode("exams_list");
      }
      await loadFinalExamsList();
    } catch (err: any) {
      alert("فشل حذف الامتحان: " + err.message);
    }
  }

  // Save/Update Quiz Metadata in Editor
  async function handleSaveQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !quiz) return;

    try {
      setIsSavingQuiz(true);
      
      const payload = {
        id: quiz.id,
        course_id: courseId,
        lesson_id: lessonId || null,
        title: quizTitle.trim(),
        description: quizDescription.trim() || null,
        type: (lessonId ? "quiz" : "final") as "quiz" | "final",
        passing_score: passingScore,
        duration: duration ? Number(duration) : null,
        start_time: startTime ? new Date(startTime).toISOString() : null,
        end_time: endTime ? new Date(endTime).toISOString() : null,
        is_active: isActive,
        show_solutions: showSolutions
      };

      const saved = await saveQuiz(payload);
      alert("✅ تم حفظ إعدادات الامتحان بنجاح.");
      setQuiz(saved);
      loadQuizDetails(quiz.id);
      loadFinalExamsList();
    } catch (error: any) {
      alert("فشل حفظ إعدادات الامتحان: " + error.message);
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
      loadQuizDetails(quiz.id);
    } catch (err: any) {
      console.error("خطأ استيراد الأسئلة:", err);
      const errMsg = err?.message || err?.error_description || (typeof err === "object" ? JSON.stringify(err) : String(err));
      alert("حدث خطأ أثناء استيراد الأسئلة: " + errMsg);
    } finally {
      setIsImporting(false);
    }
  }

  // Open Q Modal in Add mode
  function openAddQModal(type: "mcq" | "paragraph" = "mcq") {
    setQModalMode("add");
    setSelectedQId(null);
    setQType(type);
    setMinWords(150);
    setMaxWords(180);
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
    setQType(q.type || "mcq");
    setMinWords(typeof q.min_words === "number" ? q.min_words : 150);
    setMaxWords(typeof q.max_words === "number" ? q.max_words : 180);
    setQText(q.question_text || "");
    setQImageUrl(q.question_image || "");
    setQImageFile(null);
    setCorrectOption(q.correct_option || "A");

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

  // Handle Question Submit
  async function handleSaveQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!quiz) return;

    if (!qText.trim() && !qImageUrl && !qImageFile) {
      alert("يرجى كتابة نص السؤال أو رفع صورة السؤال.");
      return;
    }

    try {
      setIsSavingQ(true);

      let finalQImageUrl = qImageUrl;
      if (qImageFile) {
        finalQImageUrl = await uploadQuizImage(qImageFile);
      }

      let finalOptAImageUrl = optAImageUrl;
      if (optAImageFile) finalOptAImageUrl = await uploadQuizImage(optAImageFile);

      let finalOptBImageUrl = optBImageUrl;
      if (optBImageFile) finalOptBImageUrl = await uploadQuizImage(optBImageFile);

      let finalOptCImageUrl = optCImageUrl;
      if (optCImageFile) finalOptCImageUrl = await uploadQuizImage(optCImageFile);

      let finalOptDImageUrl = optDImageUrl;
      if (optDImageFile) finalOptDImageUrl = await uploadQuizImage(optDImageFile);

      const optionsPayload = qType === "mcq" ? [
        { option_letter: "A" as const, option_text: optAText.trim() || null, option_image: finalOptAImageUrl || null },
        { option_letter: "B" as const, option_text: optBText.trim() || null, option_image: finalOptBImageUrl || null },
        { option_letter: "C" as const, option_text: optCText.trim() || null, option_image: finalOptCImageUrl || null },
        { option_letter: "D" as const, option_text: optDText.trim() || null, option_image: finalOptDImageUrl || null },
      ] : [];

      const questionPayload = {
        id: selectedQId || undefined,
        question_text: qText.trim() || null,
        question_image: finalQImageUrl || null,
        correct_option: qType === "mcq" ? correctOption : "A",
        type: qType,
        min_words: qType === "paragraph" ? minWords : undefined,
        max_words: qType === "paragraph" ? maxWords : undefined,
      };

      await saveQuestion(quiz.id, questionPayload, optionsPayload);
      alert(selectedQId ? "تم تحديث السؤال بنجاح." : "تمت إضافة السؤال بنجاح.");
      setShowQModal(false);
      loadQuizDetails(quiz.id);
    } catch (error: any) {
      alert("فشل حفظ السؤال: " + error.message);
    } finally {
      setIsSavingQ(false);
    }
  }

  // Delete Question
  async function handleDeleteQuestion(qId: string) {
    if (examAttemptsCount > 0) {
      const confirmed = confirm(
        `⚠️ تنبيه: هذا الامتحان يحتوي على محاولات مسجلة للطلاب.\nحذف السؤال قد يؤثر على الدرجات المحسوبة سابقاً.\nهل أنت متأكد من الحذف؟`
      );
      if (!confirmed) return;
    } else {
      if (!confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;
    }

    try {
      await deleteQuestion(qId);
      loadQuizDetails(quiz.id);
    } catch (error: any) {
      alert("فشل حذف السؤال: " + error.message);
    }
  }

  // Move Question Order Up / Down
  async function handleMoveQuestion(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const currentQ = questions[index];
    const targetQ = questions[targetIndex];

    try {
      const currentOrder = currentQ.order_num ?? index + 1;
      const targetOrder = targetQ.order_num ?? targetIndex + 1;

      await Promise.all([
        supabase.from("questions").update({ order_num: targetOrder }).eq("id", currentQ.id),
        supabase.from("questions").update({ order_num: currentOrder }).eq("id", targetQ.id),
      ]);

      loadQuizDetails(quiz.id);
    } catch (err: any) {
      console.error("Failed to reorder questions:", err);
    }
  }

  // Passage Group Handlers
  function openAddPassageModal() {
    setPassageModalMode("add");
    setPassageGroupId(`passage_${Date.now()}_${Math.random().toString(36).substring(7)}`);
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
    setPassageQuestions(
      passageGroup.questions.map((q) => {
        const optA = q.options?.find((o: any) => o.option_letter === "A");
        const optB = q.options?.find((o: any) => o.option_letter === "B");
        const optC = q.options?.find((o: any) => o.option_letter === "C");
        const optD = q.options?.find((o: any) => o.option_letter === "D");
        return {
          id: q.id,
          question_text: q.question_text || "",
          question_image: q.question_image || "",
          correct_option: q.correct_option || "A",
          options: [
            { option_letter: "A" as const, option_text: optA?.option_text || "", option_image: optA?.option_image || "" },
            { option_letter: "B" as const, option_text: optB?.option_text || "", option_image: optB?.option_image || "" },
            { option_letter: "C" as const, option_text: optC?.option_text || "", option_image: optC?.option_image || "" },
            { option_letter: "D" as const, option_text: optD?.option_text || "", option_image: optD?.option_image || "" },
          ],
        };
      })
    );
    setDeletedPassageQIds([]);
    setShowPassageQForm(false);
    setEditingPassageQIndex(null);
    setShowPassageModal(true);
  }

  function handleSavePassageQuestionDraft() {
    if (!pqText.trim() && !pqImageUrl && !pqImageFile) {
      alert("يرجى كتابة نص السؤال أو رفع صورة السؤال.");
      return;
    }

    const newQItem = {
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
      ],
    };

    if (editingPassageQIndex !== null) {
      const updated = [...passageQuestions];
      updated[editingPassageQIndex] = newQItem;
      setPassageQuestions(updated);
    } else {
      setPassageQuestions([...passageQuestions, newQItem]);
    }

    setShowPassageQForm(false);
    setEditingPassageQIndex(null);
  }

  function handleDeletePassageQuestionDraft(index: number) {
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
      loadQuizDetails(quiz.id);
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
      loadQuizDetails(quiz.id);
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

  // Filtered results for Results View
  const filteredResultsStudents = (resultsReport?.students || []).filter((s: any) => {
    const matchesSearch =
      resultsSearchTerm.trim() === "" ||
      s.student?.full_name?.toLowerCase().includes(resultsSearchTerm.toLowerCase()) ||
      s.student?.phone?.includes(resultsSearchTerm) ||
      s.student?.email?.toLowerCase().includes(resultsSearchTerm.toLowerCase()) ||
      s.student?.governorate?.toLowerCase().includes(resultsSearchTerm.toLowerCase());

    const matchesFilter =
      resultsFilterStatus === "all" ||
      (resultsFilterStatus === "passed" && s.isPassed) ||
      (resultsFilterStatus === "failed" && !s.isPassed);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* ========================================================================= */}
      {/* VIEW 1: Final Exams List Dashboard (Course-level Multiple Exams)          */}
      {/* ========================================================================= */}
      {!lessonId && viewMode === "exams_list" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm">
            <div>
              <Link 
                href="/admin/courses"
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#7D79F1] font-bold mb-2 transition"
              >
                <ArrowRight size={14} />
                العودة لصفحة الكورسات
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2D2B7A] flex items-center gap-2.5">
                🏆 الامتحانات النهائية الشاملة
              </h1>
              <p className="text-gray-500 mt-1 text-sm font-semibold">
                الكورس: <strong className="text-[#7D79F1]">{courseTitle}</strong> | إدارة وإنشاء وتكرار الامتحانات الشاملة
              </p>
            </div>

            <button
              onClick={() => setShowAddExamModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#2D2B7A] to-[#7D79F1] hover:from-[#1E1C5A] hover:to-[#655EF0] text-white font-extrabold shadow-md hover:shadow-lg hover:shadow-purple-500/25 transition active:scale-95 text-sm"
            >
              <Plus size={18} />
              <span>إضافة امتحان نهائي جديد</span>
            </button>
          </div>

          {/* Quick KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7D79F1] flex items-center justify-center font-black">
                <Award size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 block">إجمالي الامتحانات النهائية</span>
                <span className="text-2xl font-black text-[#2D2B7A]">{finalExamsList.length}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 block">الامتحانات المنشورة للطلاب</span>
                <span className="text-2xl font-black text-emerald-600">
                  {finalExamsList.filter((e) => e.is_active).length}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <Users size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 block">إجمالي المحاولات المسجلة</span>
                <span className="text-2xl font-black text-blue-700">
                  {finalExamsList.reduce((acc, e) => acc + (e.totalAttempts || 0), 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Exams Cards Grid */}
          {loadingExamsList ? (
            <div className="p-16 text-center bg-white rounded-3xl border shadow-sm">
              <Loader2 className="animate-spin text-[#7D79F1] mx-auto mb-3" size={36} />
              <p className="text-gray-500 font-bold">جاري تحميل قائمة الامتحانات النهائية...</p>
            </div>
          ) : finalExamsList.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 text-[#7D79F1] flex items-center justify-center mx-auto shadow-inner">
                <Award size={32} />
              </div>
              <h3 className="text-lg font-black text-[#2D2B7A]">لا توجد امتحانات نهائية مضافة لهذا الكورس بعد</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                يمكنك إضافة عدة امتحانات نهائية شاملة (مثل: امتحان نهائي 1، امتحان 2، مراجعة نهائية، إلخ) مع أسئلة ومحاولات ونتائج مستقلة تماماً لكل امتحان.
              </p>
              <button
                onClick={() => setShowAddExamModal(true)}
                className="px-6 py-2.5 rounded-xl bg-[#7D79F1] text-white font-bold text-sm hover:bg-[#655EF0] transition"
              >
                + إنشاء أول امتحان نهائي للكورس
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {finalExamsList.map((exam) => {
                const now = new Date();
                const isUpcoming = exam.start_time && new Date(exam.start_time) > now;
                const isExpired = exam.end_time && new Date(exam.end_time) < now;

                return (
                  <div
                    key={exam.id}
                    className="bg-white rounded-3xl border border-gray-200 shadow-xs hover:shadow-md transition duration-200 p-6 flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      
                      {/* Card Header & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-[#2D2B7A] line-clamp-1">
                            {exam.title}
                          </h3>
                          {exam.description ? (
                            <p className="text-xs text-gray-500 line-clamp-2">{exam.description}</p>
                          ) : (
                            <span className="text-[11px] text-gray-400">امتحان شامل للكورس</span>
                          )}
                        </div>

                        {exam.is_active ? (
                          isExpired ? (
                            <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0">
                              مغلق (منتهي)
                            </span>
                          ) : isUpcoming ? (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0">
                              مجدول قريباً
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0">
                              منشور ومتاح
                            </span>
                          )
                        ) : (
                          <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0">
                            مسودة (مخفي)
                          </span>
                        )}
                      </div>

                      {/* Chips / Metadata */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-1.5 font-bold">
                          <BookOpen size={14} className="text-[#7D79F1]" />
                          <span>{exam.questionsCount || 0} أسئلة</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <Clock size={14} className="text-blue-500" />
                          <span>{exam.duration ? `${exam.duration} دقيقة` : "بدون مؤقت"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <Award size={14} className="text-amber-500" />
                          <span>النجاح: {exam.passing_score}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <Users size={14} className="text-emerald-500" />
                          <span>{exam.participatingStudentsCount || 0} طالب ({exam.totalAttempts || 0} محاولة)</span>
                        </div>
                      </div>

                      {/* Time Window Notice if set */}
                      {(exam.start_time || exam.end_time) && (
                        <div className="text-[11px] text-gray-500 space-y-0.5 bg-purple-50/40 p-2.5 rounded-xl border border-purple-100">
                          {exam.start_time && (
                            <div>🟢 يبدأ: {new Date(exam.start_time).toLocaleString("ar-EG")}</div>
                          )}
                          {exam.end_time && (
                            <div>🔴 ينتهي: {new Date(exam.end_time).toLocaleString("ar-EG")}</div>
                          )}
                        </div>
                      )}

                    </div>

                    {/* Actions Toolbar */}
                    <div className="space-y-2 border-t pt-4">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => loadQuizResults(exam.id)}
                          className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-[#7D79F1] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                          title="عرض نتائج ودرجات الطلاب"
                        >
                          <BarChart3 size={15} />
                          <span>النتائج ({exam.participatingStudentsCount || 0})</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedQuizId(exam.id);
                            setViewMode("editor");
                            loadQuizDetails(exam.id);
                          }}
                          className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                          title="تعديل الأسئلة والإعدادات"
                        >
                          <Edit2 size={15} />
                          <span>الأسئلة والإعدادات</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => handleDuplicateExam(exam.id, exam.title)}
                          className="flex-1 py-2 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                          title="عمل نسخة جديدة من هذا الامتحان وأسئلته"
                        >
                          <Copy size={14} />
                          <span>تكرار (Duplicate)</span>
                        </button>

                        <button
                          onClick={() => handleToggleExamStatus(exam.id, exam.is_active)}
                          className={`p-2 rounded-xl transition flex items-center justify-center ${
                            exam.is_active
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                          title={exam.is_active ? "إخفاء الامتحان عن الطلاب (تحويل لمسودة)" : "نشر الامتحان للطلاب"}
                        >
                          {exam.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>

                        <button
                          onClick={() => handleDeleteExam(exam.id, exam.title)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition"
                          title="حذف الامتحان"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: Single Exam Results Report Dashboard                              */}
      {/* ========================================================================= */}
      {viewMode === "results" && resultsReport && (
        <div className="space-y-6">
          
          {/* Header */}
          <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <button
                onClick={() => {
                  setViewMode("exams_list");
                  loadFinalExamsList();
                }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#7D79F1] font-bold mb-2 transition"
              >
                <ArrowRight size={14} />
                العودة لقائمة الامتحانات النهائية
              </button>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2D2B7A] flex items-center gap-2">
                📊 تقرير نتائج: {resultsReport.quiz.title}
              </h1>
              <p className="text-gray-500 text-sm font-semibold mt-1">
                الكورس: {courseTitle} | درجة النجاح: {resultsReport.passingScore}% | إجمالي الأسئلة: {resultsReport.totalQuestions}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setViewMode("editor");
                  loadQuizDetails(resultsReport.quiz.id);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition flex items-center gap-1.5"
              >
                <Edit2 size={15} />
                تعديل أسئلة الامتحان
              </button>
            </div>
          </div>

          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border shadow-xs">
              <span className="text-xs font-bold text-gray-400 block mb-1">الطلاب المشاركون</span>
              <span className="text-2xl font-black text-[#2D2B7A]">{resultsReport.kpis.totalParticipants}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border shadow-xs">
              <span className="text-xs font-bold text-gray-400 block mb-1">الناجحين ✓</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-600">{resultsReport.kpis.passedCount}</span>
                <span className="text-xs text-emerald-500 font-bold">({resultsReport.kpis.passRate}%)</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border shadow-xs">
              <span className="text-xs font-bold text-gray-400 block mb-1">الراسبين ✗</span>
              <span className="text-2xl font-black text-rose-600">{resultsReport.kpis.failedCount}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border shadow-xs">
              <span className="text-xs font-bold text-gray-400 block mb-1">متوسط الدرجات</span>
              <span className="text-2xl font-black text-[#7D79F1]">{resultsReport.kpis.averageScore}%</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border shadow-xs">
              <span className="text-xs font-bold text-gray-400 block mb-1">إجمالي المحاولات</span>
              <span className="text-2xl font-black text-blue-600">{resultsReport.kpis.totalAttempts}</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="ابحث بالاسم، الهاتف، المحافظة..."
                value={resultsSearchTerm}
                onChange={(e) => setResultsSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-[#7D79F1]"
              />
              <Search className="absolute right-3 top-3 text-gray-400" size={16} />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setResultsFilterStatus("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  resultsFilterStatus === "all" ? "bg-[#7D79F1] text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                الكل ({resultsReport.students.length})
              </button>
              <button
                onClick={() => setResultsFilterStatus("passed")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  resultsFilterStatus === "passed" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                الناجحين ({resultsReport.kpis.passedCount})
              </button>
              <button
                onClick={() => setResultsFilterStatus("failed")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  resultsFilterStatus === "failed" ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                الراسبين ({resultsReport.kpis.failedCount})
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
            {filteredResultsStudents.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-bold">
                لا يوجد طلاب يطابقون خيارات البحث أو لم يقم أي طالب بالحل بعد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-[#F8F9FD] text-[#2D2B7A] font-extrabold text-xs border-b">
                    <tr>
                      <th className="p-4">الطالب</th>
                      <th className="p-4">رقم الهاتف</th>
                      <th className="p-4 text-center">المحاولات</th>
                      <th className="p-4 text-center">أفضل درجة</th>
                      <th className="p-4 text-center">آخر درجة</th>
                      <th className="p-4 text-center">النسبة</th>
                      <th className="p-4 text-center">الحالة</th>
                      <th className="p-4">تاريخ آخر تسليم</th>
                      <th className="p-4 text-center">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs text-gray-700">
                    {filteredResultsStudents.map((item: any) => (
                      <tr key={item.student.id} className="hover:bg-purple-50/20 transition">
                        <td className="p-4">
                          <div className="font-bold text-[#2D2B7A]">{item.student.full_name}</div>
                          <div className="text-[11px] text-gray-400">{item.student.email}</div>
                          {item.student.governorate && (
                            <span className="text-[10px] text-gray-400">📍 {item.student.governorate}</span>
                          )}
                        </td>
                        <td className="p-4 font-semibold font-mono">{item.student.phone}</td>
                        <td className="p-4 text-center font-bold">
                          <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-gray-700 font-mono">
                            {item.attemptsCount}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-[#7D79F1]">
                          {item.bestScore}%
                        </td>
                        <td className="p-4 text-center font-bold text-gray-600">
                          {item.latestScore}%
                        </td>
                        <td className="p-4 text-center">
                          <div className="w-20 mx-auto bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${item.isPassed ? "bg-emerald-500" : "bg-rose-500"}`}
                              style={{ width: `${Math.min(item.bestScore, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 mt-1 block">
                            {item.bestScore}%
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-extrabold inline-block ${
                              item.isPassed
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {item.isPassed ? "ناجح ✓" : "راسب ✗"}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 font-medium">
                          {item.latestSubmittedAt
                            ? new Date(item.latestSubmittedAt).toLocaleString("ar-EG", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "—"}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setSelectedStudentAttemptsModal(item)}
                            className="px-3 py-1.5 bg-purple-50 text-[#7D79F1] hover:bg-purple-100 rounded-xl font-bold transition text-xs"
                          >
                            استعراض ({item.attemptsList.length})
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: Quiz/Exam Editor & Question Builder                               */}
      {/* ========================================================================= */}
      {viewMode === "editor" && (
        <div className="space-y-6">
          
          {/* Top Navigation Back Link */}
          <div>
            <button
              onClick={() => {
                if (lessonId) {
                  router.push(`/admin/lesson?courseId=${courseId}`);
                } else {
                  setViewMode("exams_list");
                  loadFinalExamsList();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#7D79F1] font-bold mb-2 transition cursor-pointer"
            >
              <ArrowRight size={14} />
              {lessonId ? "العودة لقائمة المحاضرات" : "العودة لقائمة الامتحانات النهائية"}
            </button>

            <h1 className="text-3xl font-extrabold text-[#2D2B7A]">
              {lessonId ? "📚 إدارة واجب المحاضرة" : `🏆 ${quiz?.title || "محرر الامتحان النهائي"}`}
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-semibold">
              الكورس: {courseTitle} {lessonTitle && `| المحاضرة: ${lessonTitle}`}
            </p>
          </div>

          {/* Safety Alert Banner if exam already has student attempts */}
          {examAttemptsCount > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-start gap-3.5 animate-in fade-in">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={22} />
              <div className="space-y-1 text-xs text-amber-900 leading-relaxed font-semibold">
                <p className="font-extrabold text-sm text-amber-950">
                  ⚠️ تنبيه هام: تم تسجيل ({examAttemptsCount}) محاولة تسليم سابقة من الطلاب على هذا الامتحان.
                </p>
                <p>
                  يرجى تجنب حذف أسئلة أو تغيير الإجابات النموذجية حتى لا تتأثر الدرجات التاريخية للطلاب المسجلين.
                  إذا كنت ترغب في تعديل هيكلي، يُنصح بعمل نسخة جديدة من الامتحان (Duplicate) وتعديلها بشكل مستقل.
                </p>
              </div>
            </div>
          )}

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

                {!lessonId && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">وصف الامتحان (اختياري)</label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-2 rounded-xl border outline-none text-[#2D2B7A] focus:border-[#7D79F1] text-xs font-medium resize-none"
                      value={quizDescription}
                      onChange={(e) => setQuizDescription(e.target.value)}
                      placeholder="وصف مختصر لمحتوى الامتحان..."
                    />
                  </div>
                )}

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

                {/* Show Solutions / Model Answers after Exam ends */}
                {!lessonId && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-150 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="show_solutions"
                        className="w-4 h-4 text-[#7D79F1] border-gray-300 rounded focus:ring-[#7D79F1]/20 cursor-pointer"
                        checked={showSolutions}
                        onChange={(e) => setShowSolutions(e.target.checked)}
                      />
                      <label htmlFor="show_solutions" className="text-xs font-bold text-[#2D2B7A] cursor-pointer">
                        👁️ إتاحة مراجعة الحل وتصحيح الأسئلة للطلاب
                      </label>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed pr-6">
                      عند التفعيل، سيتمكن الطلاب من مراجعة الأسئلة وتصحيح إجاباتهم بعد تسليم الامتحان.
                    </p>
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
                  <FileText size={18} />
                  الأسئلة وبنك الأسئلة ({questions.length})
                </button>
                <button
                  onClick={() => setActiveTab("students")}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "students" 
                      ? "bg-[#7D79F1] text-white shadow" 
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Users size={18} />
                  نتائج الطلاب وتقييماتهم
                </button>
              </div>

              {/* Questions Tab Content */}
              {activeTab === "questions" && (
                <div className="space-y-6">
                  
                  {/* Action Bar */}
                  <div className="flex flex-wrap gap-2.5 items-center justify-between bg-white p-4 rounded-2xl border shadow-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => openAddQModal("mcq")}
                        className="px-4 py-2.5 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <Plus size={15} />
                        إضافة سؤال اختيار من متعدد
                      </button>

                      <button
                        onClick={() => openAddQModal("paragraph")}
                        className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-[#7D79F1] border border-purple-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus size={15} />
                        إضافة سؤال مقالي (Paragraph)
                      </button>

                      <button
                        onClick={openAddPassageModal}
                        className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <BookOpen size={15} />
                        إضافة قطعة قراءة (Passage)
                      </button>
                    </div>

                    <button
                      onClick={openImportModal}
                      className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Layers size={15} />
                      استيراد من بنك الأسئلة
                    </button>
                  </div>

                  {/* Questions Render */}
                  {questions.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border text-center space-y-3">
                      <FileText className="mx-auto text-gray-300" size={40} />
                      <h3 className="text-base font-bold text-[#2D2B7A]">لا توجد أسئلة مضافة بعد</h3>
                      <p className="text-xs text-gray-400">ابدأ بإضافة سؤال اختيار من متعدد أو سؤال مقالي أو استورد من كورس آخر.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupedItems.map((item, index) => {
                        if (item.type === "passage") {
                          return (
                            <div
                              key={item.passageId}
                              className="bg-white rounded-3xl border-2 border-indigo-100 p-6 space-y-4 shadow-xs"
                            >
                              <div className="flex items-center justify-between border-b pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-xs">
                                    📖
                                  </span>
                                  <div>
                                    <h3 className="font-black text-[#2D2B7A] text-sm">{item.passageTitle}</h3>
                                    <span className="text-[11px] text-gray-400">{item.questions.length} أسئلة مرتبطة بهذه القطعة</span>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openEditPassageModal(item)}
                                    className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                  >
                                    <Edit2 size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePassageGroup(item.passageId)}
                                    className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>

                              <div className="p-4 bg-gray-50 rounded-2xl text-xs text-gray-700 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap font-medium">
                                {item.passageText}
                              </div>

                              <div className="space-y-3 pt-2">
                                {item.questions.map((subQ: any, subIdx: number) => (
                                  <div key={subQ.id} className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs flex justify-between items-center">
                                    <span className="font-bold text-[#2D2B7A]">{subIdx + 1}. {subQ.question_text}</span>
                                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border text-indigo-700 font-bold">
                                      الإجابة: ({subQ.correct_option})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        // Single Question
                        const q = item.question;
                        return (
                          <div
                            key={q.id}
                            className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <span className="w-8 h-8 rounded-xl bg-purple-50 text-[#7D79F1] font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
                                  {index + 1}
                                </span>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                      q.type === "paragraph" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-purple-50 text-[#7D79F1]"
                                    }`}>
                                      {q.type === "paragraph" ? "سؤال مقالي (Paragraph)" : "اختيار من متعدد"}
                                    </span>
                                  </div>
                                  <p className="text-sm font-bold text-[#2D2B7A] leading-relaxed">
                                    {q.question_text || "سؤال يعتمد على الصورة"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleMoveQuestion(index, "up")}
                                  disabled={index === 0}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#7D79F1] hover:bg-purple-50 disabled:opacity-30"
                                  title="تحريك لأعلى"
                                >
                                  <ArrowUp size={16} />
                                </button>
                                <button
                                  onClick={() => handleMoveQuestion(index, "down")}
                                  disabled={index === questions.length - 1}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#7D79F1] hover:bg-purple-50 disabled:opacity-30"
                                  title="تحريك لأسفل"
                                >
                                  <ArrowDown size={16} />
                                </button>
                                <button
                                  onClick={() => openEditQModal(q)}
                                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                                  title="تعديل السؤال"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                                  title="حذف السؤال"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {q.question_image && (
                              <div className="w-full max-w-sm rounded-xl overflow-hidden border">
                                <img src={q.question_image} alt="Question" className="w-full h-auto object-contain max-h-48" />
                              </div>
                            )}

                            {q.type === "paragraph" ? (
                              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-amber-900 font-semibold">
                                عدد الكلمات المطلوب: من {q.min_words || 150} إلى {q.max_words || 180} كلمة.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                {q.options?.map((opt: any) => (
                                  <div
                                    key={opt.id || opt.option_letter}
                                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                                      opt.option_letter === q.correct_option
                                        ? "bg-green-50 border-green-300 text-green-900 font-bold"
                                        : "bg-gray-50 border-gray-100 text-gray-700"
                                    }`}
                                  >
                                    <span className="w-6 h-6 rounded-lg bg-white border flex items-center justify-center font-bold text-[11px] shrink-0">
                                      {opt.option_letter}
                                    </span>
                                    <span className="truncate">{opt.option_text || "صورة"}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

              {/* Course-wide Students Performance Tab */}
              {activeTab === "students" && (
                <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="font-extrabold text-lg text-[#2D2B7A]">أداء طلاب الكورس في الامتحانات والواجبات</h3>
                    <span className="text-xs text-gray-400 font-bold">{studentPerformance.length} طالب مسجل</span>
                  </div>

                  {loadingStudents ? (
                    <div className="p-12 text-center text-gray-500 font-bold">جاري تحميل نتائج الطلاب...</div>
                  ) : studentPerformance.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 font-bold">لا يوجد طلاب مسجلين في هذا الكورس حالياً.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead className="bg-gray-50 text-[#2D2B7A] font-extrabold border-b">
                          <tr>
                            <th className="p-3">اسم الطالب</th>
                            <th className="p-3">الهاتف</th>
                            <th className="p-3 text-center">الامتحانات المكتملة</th>
                            <th className="p-3 text-center">الامتحان الحالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-gray-700">
                          {studentPerformance.map((item: any) => {
                            const thisExamResult = (item.finalExamsResults || []).find((fe: any) => fe.quizId === quiz?.id);
                            return (
                              <tr key={item.student.id} className="hover:bg-gray-50">
                                <td className="p-3 font-bold text-[#2D2B7A]">{item.student.full_name}</td>
                                <td className="p-3 font-mono">{item.student.phone}</td>
                                <td className="p-3 text-center">
                                  <span className="px-2.5 py-1 bg-purple-50 text-[#7D79F1] font-bold rounded-lg">
                                    {item.progress}%
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  {thisExamResult ? (
                                    thisExamResult.status === "submitted" ? (
                                      <span className={`px-2.5 py-1 rounded-lg font-bold ${
                                        thisExamResult.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                      }`}>
                                        {thisExamResult.score}% ({thisExamResult.passed ? "ناجح" : "راسب"})
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 font-semibold">لم يبدأ بعد</span>
                                    )
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Add New Final Exam Modal                                         */}
      {/* ========================================================================= */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#2D2B7A] to-[#7D79F1] p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Award size={22} className="text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black">إضافة امتحان نهائي جديد</h3>
                  <p className="text-xs text-purple-200">إنشاء امتحان شامل مستقل للكورس</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddExamModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewExam} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم الامتحان *</label>
                <input
                  type="text"
                  required
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  placeholder="مثال: الامتحان النهائي الشامل 1"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm font-semibold focus:border-[#7D79F1]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">وصف الامتحان (اختياري)</label>
                <textarea
                  rows={2}
                  value={newExamDescription}
                  onChange={(e) => setNewExamDescription(e.target.value)}
                  placeholder="ملاحظات أو توجيهات حول الامتحان..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none text-xs font-semibold focus:border-[#7D79F1] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">درجة النجاح (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={newExamPassingScore}
                    onChange={(e) => setNewExamPassingScore(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none text-sm font-semibold focus:border-[#7D79F1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المدة (بالدقائق)</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="بدون وقت محدد"
                    value={newExamDuration}
                    onChange={(e) => setNewExamDuration(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none text-sm font-semibold focus:border-[#7D79F1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ البدء (اختياري)</label>
                  <input
                    type="datetime-local"
                    value={newExamStartTime}
                    onChange={(e) => setNewExamStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-xs font-semibold focus:border-[#7D79F1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ الانتهاء (اختياري)</label>
                  <input
                    type="datetime-local"
                    value={newExamEndTime}
                    onChange={(e) => setNewExamEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-xs font-semibold focus:border-[#7D79F1]"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl border space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newExamIsActive}
                    onChange={(e) => setNewExamIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#7D79F1] rounded"
                  />
                  <span className="text-xs font-bold text-gray-800">نشر الامتحان فوراً للطلاب</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newExamShowSolutions}
                    onChange={(e) => setNewExamShowSolutions(e.target.checked)}
                    className="w-4 h-4 text-[#7D79F1] rounded"
                  />
                  <span className="text-xs font-bold text-gray-800">إتاحة تصحيح ونموذج الإجابة بعد التسليم</span>
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddExamModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-gray-700 font-bold text-xs hover:bg-gray-100 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isCreatingExam}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#2D2B7A] to-[#7D79F1] text-white font-bold text-xs hover:shadow-md transition flex items-center justify-center gap-2"
                >
                  {isCreatingExam ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  <span>إنشاء وبدء إضافة الأسئلة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Student Attempts Detail Drawer / Modal                           */}
      {/* ========================================================================= */}
      {selectedStudentAttemptsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border overflow-hidden animate-in fade-in">
            <div className="bg-[#2D2B7A] p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-base">{selectedStudentAttemptsModal.student.full_name}</h3>
                <p className="text-xs text-purple-200">سجل محاولات الامتحان الكامل</p>
              </div>
              <button
                onClick={() => setSelectedStudentAttemptsModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2.5">
                {selectedStudentAttemptsModal.attemptsList.map((att: any, i: number) => (
                  <div key={att.id || i} className="p-4 rounded-2xl border bg-gray-50 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-xs text-[#2D2B7A] block">محاولة رقم {selectedStudentAttemptsModal.attemptsList.length - i}</span>
                      <span className="text-[11px] text-gray-400">
                        {att.submitted_at ? new Date(att.submitted_at).toLocaleString("ar-EG") : "—"}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-base font-black text-[#7D79F1] block">{att.score}%</span>
                      {att.total_questions && (
                        <span className="text-[10px] text-gray-500 font-bold">{att.correct_count} / {att.total_questions} صحيحة</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Question Form Modal & Passage Modal & Import Modal                        */}
      {/* ========================================================================= */}
      {/* MCQ / Paragraph Question Modal */}
      {showQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border overflow-hidden animate-in fade-in">
            <div className="bg-[#2D2B7A] p-5 text-white flex justify-between items-center">
              <h3 className="font-black text-base">
                {qModalMode === "add" ? (qType === "paragraph" ? "إضافة سؤال مقالي جديد" : "إضافة سؤال اختيار من متعدد") : "تعديل السؤال"}
              </h3>
              <button onClick={() => setShowQModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نوع السؤال</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setQType("mcq")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      qType === "mcq" ? "bg-[#7D79F1] text-white border-[#7D79F1]" : "bg-white text-gray-700 border-gray-200"
                    }`}
                  >
                    اختيار من متعدد (MCQ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQType("paragraph")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      qType === "paragraph" ? "bg-[#7D79F1] text-white border-[#7D79F1]" : "bg-white text-gray-700 border-gray-200"
                    }`}
                  >
                    سؤال مقالي (Paragraph)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نص السؤال</label>
                <textarea
                  rows={3}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="اكتب نص السؤال هنا..."
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-[#7D79F1] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">صورة السؤال (اختياري)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setQImageFile(e.target.files?.[0] || null)}
                  className="w-full text-xs"
                />
              </div>

              {qType === "paragraph" ? (
                <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">الحد الأدنى للكلمات</label>
                    <input
                      type="number"
                      value={minWords}
                      onChange={(e) => setMinWords(Number(e.target.value))}
                      className="w-full p-2 bg-white rounded-xl border text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">الحد الأقصى للكلمات</label>
                    <input
                      type="number"
                      value={maxWords}
                      onChange={(e) => setMaxWords(Number(e.target.value))}
                      className="w-full p-2 bg-white rounded-xl border text-sm font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-gray-700">الخيارات الأربعة والإجابة الصحيحة</label>
                  {[
                    { letter: "A" as const, val: optAText, setVal: setOptAText, setFile: setOptAImageFile },
                    { letter: "B" as const, val: optBText, setVal: setOptBText, setFile: setOptBImageFile },
                    { letter: "C" as const, val: optCText, setVal: setOptCText, setFile: setOptCImageFile },
                    { letter: "D" as const, val: optDText, setVal: setOptDText, setFile: setOptDImageFile },
                  ].map((item) => (
                    <div key={item.letter} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border">
                      <input
                        type="radio"
                        name="correct_opt"
                        checked={correctOption === item.letter}
                        onChange={() => setCorrectOption(item.letter)}
                        className="accent-green-600 w-4 h-4 cursor-pointer"
                        title="تحديد كإجابة صحيحة"
                      />
                      <span className="w-6 h-6 rounded-lg bg-[#2D2B7A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {item.letter}
                      </span>
                      <input
                        type="text"
                        placeholder={`نص الاختيار (${item.letter})`}
                        value={item.val}
                        onChange={(e) => item.setVal(e.target.value)}
                        className="flex-1 p-2 rounded-lg border bg-white text-xs font-semibold outline-none focus:border-[#7D79F1]"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => item.setFile(e.target.files?.[0] || null)}
                        className="text-[10px] w-28 shrink-0"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowQModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-gray-700 font-bold text-xs hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingQ}
                  className="flex-1 py-2.5 rounded-xl bg-[#7D79F1] text-white font-bold text-xs hover:bg-[#655EF0] flex items-center justify-center gap-2"
                >
                  {isSavingQ ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  <span>حفظ السؤال</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reading Passage Modal */}
      {showPassageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border overflow-hidden animate-in fade-in">
            <div className="bg-gradient-to-r from-[#2D2B7A] to-indigo-700 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <BookOpen size={20} />
                <h3 className="font-black text-base">
                  {passageModalMode === "add" ? "إضافة قطعة قراءة وأسئلة فرعية (Passage)" : "تعديل قطعة القراءة"}
                </h3>
              </div>
              <button onClick={() => setShowPassageModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePassageGroup} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">عنوان القطعة (اختياري)</label>
                <input
                  type="text"
                  value={passageTitle}
                  onChange={(e) => setPassageTitle(e.target.value)}
                  placeholder="مثال: Reading Comprehension 1"
                  className="w-full p-2.5 rounded-xl border text-sm font-semibold outline-none focus:border-[#7D79F1]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نص القطعة الكامل *</label>
                <textarea
                  rows={6}
                  required
                  value={passageText}
                  onChange={(e) => setPassageText(e.target.value)}
                  placeholder="اكتب أو الصق نص القطعة هنا..."
                  className="w-full p-3 rounded-xl border text-xs font-medium outline-none focus:border-[#7D79F1] whitespace-pre-wrap leading-relaxed"
                />
              </div>

              {/* Sub questions header */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs text-[#2D2B7A]">الأسئلة التابعة للقطعة ({passageQuestions.length})</h4>
                  {!showPassageQForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setPqText("");
                        setPqImageUrl("");
                        setPqImageFile(null);
                        setPqCorrectOption("A");
                        setPqOptAText(""); setPqOptAImageUrl(""); setPqOptAImageFile(null);
                        setPqOptBText(""); setPqOptBImageUrl(""); setPqOptBImageFile(null);
                        setPqOptCText(""); setPqOptCImageUrl(""); setPqOptCImageFile(null);
                        setPqOptDText(""); setPqOptDImageUrl(""); setPqOptDImageFile(null);
                        setEditingPassageQIndex(null);
                        setShowPassageQForm(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition"
                    >
                      + إضافة سؤال تابع للقطعة
                    </button>
                  )}
                </div>

                {/* Sub question form inline */}
                {showPassageQForm && (
                  <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-200 space-y-3">
                    <input
                      type="text"
                      placeholder="نص السؤال..."
                      value={pqText}
                      onChange={(e) => setPqText(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-white text-xs font-semibold outline-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { letter: "A" as const, val: pqOptAText, setVal: setPqOptAText },
                        { letter: "B" as const, val: pqOptBText, setVal: setPqOptBText },
                        { letter: "C" as const, val: pqOptCText, setVal: setPqOptCText },
                        { letter: "D" as const, val: pqOptDText, setVal: setPqOptDText },
                      ].map((item) => (
                        <div key={item.letter} className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                          <input
                            type="radio"
                            name="pq_correct"
                            checked={pqCorrectOption === item.letter}
                            onChange={() => setPqCorrectOption(item.letter)}
                            className="accent-green-600"
                          />
                          <span className="text-xs font-bold text-indigo-900">{item.letter}</span>
                          <input
                            type="text"
                            placeholder={`اختيار ${item.letter}`}
                            value={item.val}
                            onChange={(e) => item.setVal(e.target.value)}
                            className="w-full text-xs outline-none"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPassageQForm(false)}
                        className="px-3 py-1.5 rounded-lg border text-xs font-bold text-gray-600 hover:bg-gray-100"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePassageQuestionDraft}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                      >
                        حفظ السؤال في القطعة
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub questions list */}
                <div className="space-y-2">
                  {passageQuestions.map((q, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-800">{idx + 1}. {q.question_text}</span>
                      <div className="flex gap-2">
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold text-[10px]">
                          صح: {q.correct_option}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePassageQuestionDraft(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowPassageModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-gray-700 font-bold text-xs hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassage}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  {isSavingPassage ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  <span>حفظ القطعة بالكامل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Questions Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border overflow-hidden animate-in fade-in">
            <div className="bg-[#2D2B7A] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Layers size={20} />
                <h3 className="font-black text-base">استيراد أسئلة من بنك الأسئلة أو كورس آخر</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اختر الكورس المصدر</label>
                  <select
                    value={selectedImportCourseId}
                    onChange={(e) => handleImportCourseChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-xs font-semibold outline-none focus:border-[#7D79F1]"
                  >
                    <option value="">-- حدد الكورس --</option>
                    {importCourses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اختر الامتحان المصدر</label>
                  <select
                    value={selectedImportQuizId}
                    onChange={(e) => handleImportQuizChange(e.target.value)}
                    disabled={!selectedImportCourseId}
                    className="w-full p-2.5 rounded-xl border text-xs font-semibold outline-none focus:border-[#7D79F1] disabled:opacity-50"
                  >
                    <option value="">-- حدد الامتحان --</option>
                    {importQuizzes.map((q) => (
                      <option key={q.id} value={q.id}>{q.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {importQuestions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-700">الأسئلة المتاحة ({importQuestions.length}):</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedQuestionIds.length === importQuestions.length) {
                          setSelectedQuestionIds([]);
                        } else {
                          setSelectedQuestionIds(importQuestions.map((q) => q.id));
                        }
                      }}
                      className="text-[#7D79F1] underline hover:text-[#655EF0]"
                    >
                      {selectedQuestionIds.length === importQuestions.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto border p-3 rounded-2xl">
                    {importQuestions.map((q, idx) => {
                      const isChecked = selectedQuestionIds.includes(q.id);
                      return (
                        <label
                          key={q.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                            isChecked ? "bg-purple-50/70 border-[#7D79F1]" : "bg-white border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                              } else {
                                setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== q.id));
                              }
                            }}
                            className="accent-[#7D79F1] mt-0.5"
                          />
                          <div className="flex-1">
                            <span className="font-bold text-[#2D2B7A] block">{idx + 1}. {q.question_text || "سؤال مع صورة"}</span>
                            {q.passage_text && <span className="text-[10px] text-indigo-600 block mt-0.5">📖 تابع لقطعة قراءة</span>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-gray-700 font-bold text-xs hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImporting || selectedQuestionIds.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isImporting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  <span>استيراد الأسئلة المحددة ({selectedQuestionIds.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ExamsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center" dir="rtl">
          <div className="text-center space-y-3">
            <Loader2 className="animate-spin text-[#7D79F1] mx-auto" size={36} />
            <p className="text-gray-500 font-bold">جاري تحميل صفحة الامتحانات...</p>
          </div>
        </div>
      }
    >
      <ExamsPageContent />
    </Suspense>
  );
}
