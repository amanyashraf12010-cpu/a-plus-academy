import { createClient } from "@/utils/supabase/client";

// =========================================================================
// 1. Quizzes Admin Management
// =========================================================================

export async function getAdminQuizzesForCourse(courseId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select("*, questions(*, options(*))")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("فشل جلب الامتحانات للكورس:", error.message);
    throw error;
  }
  return data || [];
}

export async function saveQuiz(quiz: {
  id?: string;
  course_id: string;
  lesson_id?: string | null;
  title: string;
  type: "quiz" | "final";
  passing_score: number;
  duration?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  is_active: boolean;
}) {
  const supabase = createClient();

  if (quiz.id) {
    // Update
    const { data, error } = await supabase
      .from("quizzes")
      .update({
        title: quiz.title,
        passing_score: quiz.passing_score,
        duration: quiz.duration,
        start_time: quiz.start_time,
        end_time: quiz.end_time,
        is_active: quiz.is_active,
      })
      .eq("id", quiz.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert
    const { data, error } = await supabase
      .from("quizzes")
      .insert([
        {
          course_id: quiz.course_id,
          lesson_id: quiz.lesson_id || null,
          title: quiz.title,
          type: quiz.type,
          passing_score: quiz.passing_score,
          duration: quiz.duration || null,
          start_time: quiz.start_time || null,
          end_time: quiz.end_time || null,
          is_active: quiz.is_active,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function deleteQuiz(quizId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
  if (error) throw error;
}

// =========================================================================
// 2. Question & Options Admin Management (supporting text + image)
// =========================================================================

export async function uploadQuizImage(file: File): Promise<string> {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const filePath = `quiz_files_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("quizzes-files")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error("فشل رفع الصورة: " + uploadError.message);
  }

  const { data } = supabase.storage.from("quizzes-files").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function saveQuestion(
  quizId: string,
  question: {
    id?: string;
    question_text?: string;
    question_image?: string;
    correct_option: "A" | "B" | "C" | "D";
  },
  options: Array<{
    option_letter: "A" | "B" | "C" | "D";
    option_text?: string;
    option_image?: string;
  }>
) {
  const supabase = createClient();

  let questionId = question.id;

  if (questionId) {
    // 1. Update Question
    const { error: qError } = await supabase
      .from("questions")
      .update({
        question_text: question.question_text || null,
        question_image: question.question_image || null,
        correct_option: question.correct_option,
      })
      .eq("id", questionId);

    if (qError) throw qError;
  } else {
    // 1. Insert Question
    const { data: newQ, error: qError } = await supabase
      .from("questions")
      .insert([
        {
          quiz_id: quizId,
          question_text: question.question_text || null,
          question_image: question.question_image || null,
          correct_option: question.correct_option,
        }
      ])
      .select()
      .single();

    if (qError) throw qError;
    questionId = newQ.id;
  }

  // 2. Upsert Options
  const optionsPayload = options.map((opt) => ({
    question_id: questionId!,
    option_letter: opt.option_letter,
    option_text: opt.option_text || null,
    option_image: opt.option_image || null,
  }));

  const { error: optError } = await supabase
    .from("options")
    .upsert(optionsPayload, { onConflict: "question_id,option_letter" });

  if (optError) throw optError;

  return questionId;
}

export async function deleteQuestion(questionId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("questions").delete().eq("id", questionId);
  if (error) throw error;
}

// =========================================================================
// 3. Student Performance Reporting for Admins
// =========================================================================

export async function getCourseStudentPerformance(courseId: string) {
  const supabase = createClient();

  // 1. Get all students subscribed to this course
  const { data: subscriptions, error: subError } = await supabase
    .from("subscriptions")
    .select(`
      user_id,
      status,
      profiles:user_id (id, full_name, email, phone, grade)
    `)
    .eq("course_id", courseId)
    .eq("status", "approved");

  if (subError) throw subError;

  const students = (subscriptions || [])
    .map((sub: any) => sub.profiles)
    .filter(Boolean);

  if (students.length === 0) return [];

  // 2. Get all quizzes for this course
  const { data: quizzes, error: quizzesError } = await supabase
    .from("quizzes")
    .select("id, title, type, lesson_id")
    .eq("course_id", courseId)
    .eq("is_active", true);

  if (quizzesError) throw quizzesError;

  const quizIds = (quizzes || []).map((q: any) => q.id);

  if (quizIds.length === 0) {
    return students.map((std: any) => ({
      student: std,
      progress: 0,
      quizzesResult: [],
      finalExamResult: null
    }));
  }

  // 3. Get all attempts by these students for these quizzes
  const studentIds = students.map((s: any) => s.id);
  const { data: attempts, error: attError } = await supabase
    .from("student_quiz_attempts")
    .select("*")
    .in("user_id", studentIds)
    .in("quiz_id", quizIds)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false });

  if (attError) throw attError;

  // Group attempts by user_id and quiz_id
  const attemptsMap = new Map<string, any[]>(); // key: userId_quizId
  attempts?.forEach((att: any) => {
    const key = `${att.user_id}_${att.quiz_id}`;
    if (!attemptsMap.has(key)) {
      attemptsMap.set(key, []);
    }
    attemptsMap.get(key)!.push(att);
  });

  // 4. Calculate stats for each student
  return students.map((std: any) => {
    let completedLessons = 0;
    const lessonQuizzes = (quizzes || []).filter((q: any) => q.type === "quiz");
    const finalExams = (quizzes || []).filter((q: any) => q.type === "final");

    const quizzesResult = lessonQuizzes.map((q: any) => {
      const key = `${std.id}_${q.id}`;
      const userQuizAttempts = attemptsMap.get(key) || [];
      const attemptsCount = userQuizAttempts.length;
      
      const highestScore = attemptsCount > 0 
        ? Math.max(...userQuizAttempts.map(a => Number(a.score)))
        : null;

      const passed = userQuizAttempts.some(a => Number(a.score) >= q.passing_score);
      if (passed) completedLessons++;

      return {
        quizId: q.id,
        quizTitle: q.title,
        attemptsCount,
        highestScore,
        passed,
        attempts: userQuizAttempts.map(a => ({
          score: a.score,
          correctCount: a.correct_count,
          totalQuestions: a.total_questions,
          submittedAt: a.submitted_at
        }))
      };
    });

    // Calculate progress
    const progress = lessonQuizzes.length > 0 
      ? Math.round((completedLessons / lessonQuizzes.length) * 100)
      : 100; // if no homework quizzes, they have 100% course video access progress

    // Final exam stats
    let finalExamResult = null;
    if (finalExams.length > 0) {
      const fq = finalExams[0];
      const key = `${std.id}_${fq.id}`;
      const userFinalAttempts = attemptsMap.get(key) || [];
      
      if (userFinalAttempts.length > 0) {
        const lastAtt = userFinalAttempts[0];
        finalExamResult = {
          quizId: fq.id,
          quizTitle: fq.title,
          status: "submitted",
          score: lastAtt.score,
          correctCount: lastAtt.correct_count,
          totalQuestions: lastAtt.total_questions,
          submittedAt: lastAtt.submitted_at
        };
      } else {
        // Check if there are in_progress attempts
        finalExamResult = {
          quizId: fq.id,
          quizTitle: fq.title,
          status: "not_started",
          score: null,
          correctCount: null,
          totalQuestions: null,
          submittedAt: null
        };
      }
    }

    return {
      student: std,
      progress,
      quizzesResult,
      finalExamResult
    };
  });
}
