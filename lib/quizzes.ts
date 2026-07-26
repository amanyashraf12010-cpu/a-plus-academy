import { createClient } from "@/utils/supabase/client";

// =========================================================================
// 1. Quizzes Fetching
// =========================================================================

export async function getQuizForLesson(lessonId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select("*, questions(*, options(*))")
    .eq("lesson_id", lessonId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("خطأ أثناء جلب واجب المحاضرة:", error.message);
    throw error;
  }
  return data;
}

export async function getFinalExamForCourse(courseId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select("*, questions(*, options(*))")
    .eq("course_id", courseId)
    .eq("type", "final")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("خطأ أثناء جلب الامتحان الشامل:", error.message);
    throw error;
  }
  return data;
}

// =========================================================================
// 2. Student Attempts Management
// =========================================================================

export async function startQuizAttempt(quizId: string) {
  const supabase = createClient();

  // 1. Get current logged in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولاً لبدء الامتحان.");

  // 2. Create attempt
  const { data, error } = await supabase
    .from("student_quiz_attempts")
    .insert([
      {
        user_id: user.id,
        quiz_id: quizId,
        status: "in_progress",
        started_at: new Date().toISOString(),
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("فشل بدء محاولة الامتحان:", error.message);
    throw error;
  }
  return data;
}

export async function saveAnswer(attemptId: string, questionId: string, selectedOption: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("student_answers")
    .upsert(
      {
        attempt_id: attemptId,
        question_id: questionId,
        selected_option: selectedOption,
      },
      { onConflict: "attempt_id,question_id" }
    );

  if (error) {
    console.error("خطأ في حفظ الإجابة:", error.message);
    throw error;
  }
}

export async function submitQuizAttempt(attemptId: string) {
  const supabase = createClient();

  // 1. Fetch attempt and associated quiz with questions
  const { data: attempt, error: attemptError } = await supabase
    .from("student_quiz_attempts")
    .select("*, quizzes(*, questions(*))")
    .eq("id", attemptId)
    .single();

  if (attemptError || !attempt) {
    throw new Error("لم يتم العثور على محاولة الامتحان هذه.");
  }

  const quiz = attempt.quizzes;
  const questions = quiz.questions || [];

  if (questions.length === 0) {
    // If quiz has no questions, submit with 100% score
    const { data: updatedAttempt, error: updateError } = await supabase
      .from("student_quiz_attempts")
      .update({
        status: "submitted",
        score: 100.00,
        correct_count: 0,
        total_questions: 0,
        submitted_at: new Date().toISOString()
      })
      .eq("id", attemptId)
      .select()
      .single();

    if (updateError) throw updateError;
    return { attempt: updatedAttempt, questions: [] };
  }

  // 2. Fetch student's saved answers
  const { data: savedAnswers, error: answersError } = await supabase
    .from("student_answers")
    .select("*")
    .eq("attempt_id", attemptId);

  if (answersError) throw answersError;

  const answersMap = new Map<string, string>(
    (savedAnswers || []).map((ans: any) => [ans.question_id, ans.selected_option])
  );

  // 3. Score the quiz
  let correctCount = 0;
  const scoredAnswersPayload: any[] = [];

  for (const q of questions) {
    const studentChoice = answersMap.get(q.id);
    const isCorrect = studentChoice === q.correct_option;
    if (isCorrect) correctCount++;

    if (studentChoice) {
      scoredAnswersPayload.push({
        attempt_id: attemptId,
        question_id: q.id,
        selected_option: studentChoice,
        is_correct: isCorrect
      });
    }
  }

  const scorePercentage = (correctCount / questions.length) * 100;

  // 4. Update student_answers with is_correct field (triggers DB update for all resolved answers)
  if (scoredAnswersPayload.length > 0) {
    const { error: batchUpdateError } = await supabase
      .from("student_answers")
      .upsert(scoredAnswersPayload, { onConflict: "attempt_id,question_id" });
    if (batchUpdateError) console.error("خطأ في تحديث صحة إجابات الطالب:", batchUpdateError.message);
  }

  // 5. Update attempt status, score, counts, and submission time
  const { data: finalAttempt, error: updateError } = await supabase
    .from("student_quiz_attempts")
    .update({
      status: "submitted",
      score: Number(scorePercentage.toFixed(2)),
      correct_count: correctCount,
      total_questions: questions.length,
      submitted_at: new Date().toISOString()
    })
    .eq("id", attemptId)
    .select()
    .single();

  if (updateError) {
    console.error("خطأ في إرسال وتسجيل محاولة الامتحان:", updateError.message);
    throw updateError;
  }

  return { attempt: finalAttempt };
}

export async function getQuizAttempts(userId: string, quizId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("student_quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("فشل جلب محاولات الطالب للامتحان:", error.message);
    throw error;
  }
  return data || [];
}

// =========================================================================
// 3. Lesson Lock / Unlock and Course Progress States
// =========================================================================

export async function getCourseProgressAndLocks(userId: string, courseId: string) {
  const supabase = createClient();

  // 1. Fetch all lessons
  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, title, order")
    .eq("course_id", courseId)
    .order("order", { ascending: true });

  if (lessonsError) throw lessonsError;

  if (!lessons || lessons.length === 0) {
    return { lessons: [], courseProgress: 0, finalExamUnlocked: false };
  }

  // 2. Fetch all quizzes for these lessons + final exam
  const { data: quizzes, error: quizzesError } = await supabase
    .from("quizzes")
    .select("id, lesson_id, type, passing_score")
    .eq("course_id", courseId)
    .eq("is_active", true);

  if (quizzesError) throw quizzesError;

  const quizByLessonMap = new Map<string, any>();
  let finalExam: any = null;

  (quizzes || []).forEach((q: any) => {
    if (q.type === "final") {
      finalExam = q;
    } else if (q.lesson_id) {
      quizByLessonMap.set(q.lesson_id, q);
    }
  });

  // 3. Fetch all submitted attempts for this user and these quizzes
  const quizIds = (quizzes || []).map((q: any) => q.id);
  let attempts: any[] = [];
  if (quizIds.length > 0) {
    const { data: attemptsData, error: attemptsError } = await supabase
      .from("student_quiz_attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "submitted")
      .in("quiz_id", quizIds);

    if (attemptsError) throw attemptsError;
    attempts = attemptsData || [];
  }

  const attemptsByQuizMap = new Map<string, any[]>();
  attempts.forEach((att: any) => {
    if (!attemptsByQuizMap.has(att.quiz_id)) {
      attemptsByQuizMap.set(att.quiz_id, []);
    }
    attemptsByQuizMap.get(att.quiz_id)!.push(att);
  });

  // Helper to check if a quiz is passed (score >= passing_score)
  const isQuizPassed = (quizId: string, passingScore: number) => {
    const atts = attemptsByQuizMap.get(quizId) || [];
    return atts.some((att: any) => Number(att.score) >= passingScore);
  };

  // Helper to get highest score of a quiz
  const getQuizHighestScore = (quizId: string) => {
    const atts = attemptsByQuizMap.get(quizId) || [];
    if (atts.length === 0) return null;
    return Math.max(...atts.map((att: any) => Number(att.score)));
  };

  // 4. Calculate lock states for each lesson
  const lessonsWithLockState: any[] = [];
  let isPreviousLessonQuizPassed = true; // First lesson is always unlocked

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const lessonQuiz = quizByLessonMap.get(lesson.id);
    
    // A lesson is locked if the previous lesson's quiz is NOT passed
    const isLocked = !isPreviousLessonQuizPassed;

    // Fetch quiz status for this lesson
    let quizStatus = "no_quiz";
    let highestScore: number | null = null;
    let quizAttemptsCount = 0;
    let quizId: string | null = null;
    let passingScore = 50;

    if (lessonQuiz) {
      quizId = lessonQuiz.id;
      passingScore = lessonQuiz.passing_score;
      const atts = attemptsByQuizMap.get(lessonQuiz.id) || [];
      quizAttemptsCount = atts.length;
      highestScore = getQuizHighestScore(lessonQuiz.id);

      if (atts.length === 0) {
        quizStatus = "not_started";
      } else if (isQuizPassed(lessonQuiz.id, lessonQuiz.passing_score)) {
        quizStatus = "passed";
      } else {
        quizStatus = "failed";
      }

      // Update previous lesson check for the next iteration
      isPreviousLessonQuizPassed = quizStatus === "passed";
    } else {
      // If lesson has no quiz, it counts as passed automatically for locking the next one
      isPreviousLessonQuizPassed = true;
    }

    lessonsWithLockState.push({
      ...lesson,
      isLocked,
      quizStatus,
      quizId,
      quizAttemptsCount,
      highestScore,
      passingScore
    });
  }

  // 5. Calculate course progress (%)
  // Progress = (number of lessons completed / total lessons) * 100
  // A lesson is completed if: it has no quiz, OR its quiz is passed.
  const completedLessons = lessonsWithLockState.filter(l => l.quizStatus === "passed" || l.quizStatus === "no_quiz").length;
  const courseProgress = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

  // 6. Check if final exam is unlocked (all lessons completed/passed)
  const finalExamUnlocked = completedLessons === lessons.length;

  // Fetch final exam status
  let finalExamStatus = "not_started";
  let finalExamScore: number | null = null;
  let finalExamId: string | null = null;
  let finalDuration: number | null = null;
  let finalStartTime: string | null = null;
  let finalEndTime: string | null = null;

  if (finalExam) {
    finalExamId = finalExam.id;
    finalDuration = finalExam.duration;
    finalStartTime = finalExam.start_time;
    finalEndTime = finalExam.end_time;
    const finalAtts = attemptsByQuizMap.get(finalExam.id) || [];
    if (finalAtts.length > 0) {
      finalExamStatus = "submitted";
      finalExamScore = finalAtts[0].score; // Final exam is single attempt, so we grab the first one
    }
  }

  return {
    lessons: lessonsWithLockState,
    courseProgress,
    finalExamUnlocked,
    finalExam: finalExam ? {
      id: finalExamId,
      status: finalExamStatus,
      score: finalExamScore,
      duration: finalDuration,
      startTime: finalStartTime,
      endTime: finalEndTime,
      passingScore: finalExam.passing_score
    } : null
  };
}
