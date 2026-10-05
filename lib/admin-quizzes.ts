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

export async function getAdminFinalExamsForCourse(courseId: string) {
  const supabase = createClient();

  // 1. Fetch all final exams for this course
  const { data: exams, error } = await supabase
    .from("quizzes")
    .select("*, questions(id)")
    .eq("course_id", courseId)
    .eq("type", "final")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("فشل جلب الامتحانات النهائية للكورس:", error.message);
    throw error;
  }

  const examList = exams || [];
  if (examList.length === 0) return [];

  // 2. Fetch attempts counts for all these exams
  const examIds = examList.map((e: any) => e.id);
  const { data: attempts, error: attErr } = await supabase
    .from("student_quiz_attempts")
    .select("quiz_id, user_id, score, status")
    .in("quiz_id", examIds)
    .eq("status", "submitted");

  if (attErr) console.warn("Error fetching attempts count for final exams:", attErr);

  const attemptsByExamMap = new Map<string, any[]>();
  (attempts || []).forEach((att: any) => {
    if (!attemptsByExamMap.has(att.quiz_id)) {
      attemptsByExamMap.set(att.quiz_id, []);
    }
    attemptsByExamMap.get(att.quiz_id)!.push(att);
  });

  return examList.map((exam: any) => {
    const examAttempts = attemptsByExamMap.get(exam.id) || [];
    const uniqueStudents = new Set(examAttempts.map((a: any) => a.user_id));
    const passedAttempts = examAttempts.filter((a: any) => Number(a.score) >= exam.passing_score);
    const questionsCount = Array.isArray(exam.questions) ? exam.questions.length : 0;

    return {
      ...exam,
      questionsCount,
      totalAttempts: examAttempts.length,
      participatingStudentsCount: uniqueStudents.size,
      passedCount: passedAttempts.length,
    };
  });
}

export async function checkQuizHasAttempts(quizId: string) {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("student_quiz_attempts")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", quizId)
    .eq("status", "submitted");

  if (error) {
    console.error("Error checking quiz attempts:", error);
    return { hasAttempts: false, count: 0 };
  }
  return { hasAttempts: (count || 0) > 0, count: count || 0 };
}

export async function duplicateQuiz(quizId: string, customTitle?: string) {
  const supabase = createClient();

  // 1. Fetch original quiz with all its questions and options
  const { data: originalQuiz, error: fetchErr } = await supabase
    .from("quizzes")
    .select("*, questions(*, options(*))")
    .eq("id", quizId)
    .single();

  if (fetchErr || !originalQuiz) {
    throw new Error("لم يتم العثور على الامتحان المطلوب تكراره.");
  }

  // 2. Create the new Quiz record (Draft by default)
  const newTitle = customTitle?.trim() || `${originalQuiz.title} (نسخة جديدة)`;
  const { data: newQuiz, error: createErr } = await supabase
    .from("quizzes")
    .insert([
      {
        course_id: originalQuiz.course_id,
        lesson_id: null, // Multiple final exams are course-level
        title: newTitle,
        type: originalQuiz.type,
        passing_score: originalQuiz.passing_score,
        duration: originalQuiz.duration,
        start_time: originalQuiz.start_time,
        end_time: originalQuiz.end_time,
        is_active: false, // Created as Draft so the teacher/admin can review
        show_solutions: originalQuiz.show_solutions ?? false,
      }
    ])
    .select()
    .single();

  if (createErr || !newQuiz) {
    throw new Error("فشل إنشاء نسخة الامتحان: " + createErr?.message);
  }

  // 3. Clone questions & options with fresh unique IDs
  const rawQuestions = originalQuiz.questions || [];
  if (rawQuestions.length > 0) {
    const passageMap = new Map<string, string>();

    // Sort original questions by order_num/created_at
    const sortedQuestions = [...rawQuestions].sort((a: any, b: any) => {
      const ordA = a.order_num ?? 0;
      const ordB = b.order_num ?? 0;
      return ordA - ordB;
    });

    for (const q of sortedQuestions) {
      let newPassageId = null;
      if (q.passage_id) {
        if (!passageMap.has(q.passage_id)) {
          passageMap.set(q.passage_id, `passage_${Date.now()}_${Math.random().toString(36).substring(7)}`);
        }
        newPassageId = passageMap.get(q.passage_id);
      }

      const qPayload: any = {
        quiz_id: newQuiz.id,
        question_text: q.question_text,
        question_image: q.question_image,
        correct_option: q.correct_option || "A",
        order_num: q.order_num,
        type: q.type || "mcq",
        min_words: q.min_words,
        max_words: q.max_words,
        passage_id: newPassageId,
        passage_text: q.passage_text,
      };

      const { data: newQ, error: qErr } = await supabase
        .from("questions")
        .insert([qPayload])
        .select()
        .single();

      if (!qErr && newQ && Array.isArray(q.options) && q.options.length > 0) {
        const optionsPayload = q.options.map((opt: any) => ({
          question_id: newQ.id,
          option_letter: opt.option_letter,
          option_text: opt.option_text,
          option_image: opt.option_image,
        }));
        await supabase.from("options").insert(optionsPayload);
      }
    }
  }

  return newQuiz;
}

export async function getSingleQuizResultsReport(quizId: string) {
  const supabase = createClient();

  // 1. Fetch Quiz Details
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*, questions(id), courses(id, title)")
    .eq("id", quizId)
    .single();

  if (quizError || !quiz) {
    throw new Error("لم يتم العثور على بيانات الامتحان.");
  }

  // 2. Fetch all submitted attempts for this quiz
  const { data: attempts, error: attError } = await supabase
    .from("student_quiz_attempts")
    .select(`
      id,
      user_id,
      quiz_id,
      score,
      correct_count,
      total_questions,
      status,
      started_at,
      submitted_at,
      created_at,
      profiles:user_id (id, full_name, email, phone, parent_phone, governorate, grade, school)
    `)
    .eq("quiz_id", quizId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false });

  if (attError) throw attError;

  const rawAttempts = attempts || [];
  const passingScore = Number(quiz.passing_score) || 50;

  // 3. Group attempts by student
  const studentMap = new Map<string, {
    student: any;
    attemptsCount: number;
    bestScore: number;
    latestScore: number;
    bestCorrectCount: number;
    totalQuestions: number;
    isPassed: boolean;
    latestSubmittedAt: string | null;
    attemptsList: any[];
  }>();

  rawAttempts.forEach((att: any) => {
    const student = att.profiles || {
      id: att.user_id,
      full_name: "طالب غير مسجل",
      phone: "—",
      email: "—"
    };

    const sId = att.user_id;
    const scoreNum = Number(att.score) || 0;

    if (!studentMap.has(sId)) {
      studentMap.set(sId, {
        student,
        attemptsCount: 0,
        bestScore: scoreNum,
        latestScore: scoreNum,
        bestCorrectCount: att.correct_count || 0,
        totalQuestions: att.total_questions || 0,
        isPassed: scoreNum >= passingScore,
        latestSubmittedAt: att.submitted_at || att.created_at,
        attemptsList: [],
      });
    }

    const current = studentMap.get(sId)!;
    current.attemptsCount += 1;
    current.attemptsList.push(att);

    if (scoreNum > current.bestScore) {
      current.bestScore = scoreNum;
      current.bestCorrectCount = att.correct_count || 0;
      current.totalQuestions = att.total_questions || current.totalQuestions;
    }

    if (current.bestScore >= passingScore) {
      current.isPassed = true;
    }
  });

  const studentsList = Array.from(studentMap.values()).sort((a, b) => b.bestScore - a.bestScore);

  // 4. Calculate Aggregate Summary KPIs
  const totalParticipants = studentsList.length;
  const passedStudents = studentsList.filter((s) => s.isPassed);
  const failedStudents = studentsList.filter((s) => !s.isPassed);
  const totalScoreSum = studentsList.reduce((acc, s) => acc + s.bestScore, 0);
  const averageScore = totalParticipants > 0 ? Math.round(totalScoreSum / totalParticipants) : 0;
  const passRate = totalParticipants > 0 ? Math.round((passedStudents.length / totalParticipants) * 100) : 0;

  return {
    quiz,
    totalQuestions: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
    passingScore,
    kpis: {
      totalParticipants,
      totalAttempts: rawAttempts.length,
      passedCount: passedStudents.length,
      failedCount: failedStudents.length,
      averageScore,
      passRate,
    },
    students: studentsList,
  };
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
  show_solutions?: boolean;
  description?: string | null;
}) {
  const supabase = createClient();

  const basePayload: any = {
    title: quiz.title,
    passing_score: quiz.passing_score,
    duration: quiz.duration || null,
    start_time: quiz.start_time || null,
    end_time: quiz.end_time || null,
    is_active: quiz.is_active,
  };

  const extendedPayload: any = {
    ...basePayload,
    show_solutions: quiz.show_solutions ?? false,
    description: quiz.description || null,
  };

  if (quiz.id) {
    // Update (try extended first, fallback to base if column pending migration)
    let { data, error } = await supabase
      .from("quizzes")
      .update(extendedPayload)
      .eq("id", quiz.id)
      .select()
      .single();

    if (error) {
      const fallback = await supabase
        .from("quizzes")
        .update(basePayload)
        .eq("id", quiz.id)
        .select()
        .single();
      if (fallback.error) throw fallback.error;
      data = fallback.data;
    }
    return data;
  } else {
    // Insert
    let { data, error } = await supabase
      .from("quizzes")
      .insert([
        {
          course_id: quiz.course_id,
          lesson_id: quiz.lesson_id || null,
          type: quiz.type,
          ...extendedPayload,
        }
      ])
      .select()
      .single();

    if (error) {
      const fallback = await supabase
        .from("quizzes")
        .insert([
          {
            course_id: quiz.course_id,
            lesson_id: quiz.lesson_id || null,
            type: quiz.type,
            ...basePayload,
          }
        ])
        .select()
        .single();
      if (fallback.error) throw fallback.error;
      data = fallback.data;
    }
    return data;
  }
}

export async function toggleQuizSolutions(quizId: string, showSolutions: boolean) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .update({ show_solutions: showSolutions })
    .eq("id", quizId)
    .select()
    .single();

  if (error) {
    console.error("فشل تعديل حالة إتاحة الحل للطلاب:", error.message);
    throw error;
  }
  return data;
}

export async function toggleQuizActive(quizId: string, isActive: boolean) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .update({ is_active: isActive })
    .eq("id", quizId)
    .select()
    .single();

  if (error) {
    console.error("فشل تعديل حالة تفعيل الامتحان:", error.message);
    throw error;
  }
  return data;
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
      cacheControl: "31536000",
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
    type?: "mcq" | "paragraph";
    question_text?: string | null;
    question_image?: string | null;
    correct_option?: "A" | "B" | "C" | "D" | null;
    min_words?: number | null;
    max_words?: number | null;
    passage_id?: string | null;
    passage_title?: string | null;
    passage_text?: string | null;
    order_num?: number;
  },
  options: Array<{
    option_letter: "A" | "B" | "C" | "D";
    option_text?: string | null;
    option_image?: string | null;
  }> = []
) {
  const supabase = createClient();
  let questionId = question.id;
  const qType = question.type || "mcq";

  const basePayload: any = {
    question_text: question.question_text || null,
    question_image: question.question_image || null,
    correct_option: qType === "paragraph" ? null : (question.correct_option || "A"),
  };

  const extendedPayload: any = {
    ...basePayload,
    type: qType,
    min_words: qType === "paragraph" ? (question.min_words ?? 150) : null,
    max_words: qType === "paragraph" ? (question.max_words ?? 180) : null,
    passage_id: question.passage_id || null,
    passage_title: question.passage_title || null,
    passage_text: question.passage_text || null,
    order_num: question.order_num ?? 0,
  };

  if (questionId) {
    // 1. Update Question (try extended first, fallback to base if columns missing)
    let qError = null;
    const { error: extError } = await supabase
      .from("questions")
      .update(extendedPayload)
      .eq("id", questionId);

    if (extError) {
      const { error: fallbackError } = await supabase
        .from("questions")
        .update(basePayload)
        .eq("id", questionId);
      qError = fallbackError;
    }

    if (qError) throw qError;
  } else {
    // 1. Insert Question (try extended first, fallback to base if columns missing)
    let newQ = null;
    const { data: extData, error: extError } = await supabase
      .from("questions")
      .insert([{ quiz_id: quizId, ...extendedPayload }])
      .select()
      .single();

    if (extError) {
      const { data: baseData, error: fallbackError } = await supabase
        .from("questions")
        .insert([{ quiz_id: quizId, ...basePayload }])
        .select()
        .single();
      if (fallbackError) throw fallbackError;
      newQ = baseData;
    } else {
      newQ = extData;
    }

    questionId = newQ.id;
  }

  // 2. Upsert Options only if MCQ and options provided
  if (qType === "mcq" && options && options.length > 0) {
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
  }

  return questionId;
}

export async function deleteQuestion(questionId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("questions").delete().eq("id", questionId);
  if (error) throw error;
}

export async function savePassageGroup(
  quizId: string,
  passage: {
    id: string; // generated unique group ID or existing passage_id
    title?: string;
    text: string;
    order_num?: number;
  },
  questionsList: Array<{
    id?: string;
    question_text: string;
    question_image?: string;
    correct_option: "A" | "B" | "C" | "D";
    order_num?: number;
    options: Array<{
      option_letter: "A" | "B" | "C" | "D";
      option_text?: string;
      option_image?: string;
    }>;
  }>,
  deletedQuestionIds?: string[]
) {
  const supabase = createClient();

  // 1. If any question IDs were deleted in this passage group, remove them
  if (deletedQuestionIds && deletedQuestionIds.length > 0) {
    await supabase.from("questions").delete().in("id", deletedQuestionIds);
  }

  // 2. Save each question in the passage group
  for (let i = 0; i < questionsList.length; i++) {
    const q = questionsList[i];
    await saveQuestion(
      quizId,
      {
        id: q.id,
        question_text: q.question_text,
        question_image: q.question_image,
        correct_option: q.correct_option,
        passage_id: passage.id,
        passage_title: passage.title || null,
        passage_text: passage.text,
        order_num: q.order_num ?? (passage.order_num ? passage.order_num * 100 + i : i + 1),
      },
      q.options
    );
  }
}

export async function deletePassageGroup(passageId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("questions").delete().eq("passage_id", passageId);
  if (error) throw error;
}

// =========================================================================
// 3. Bulk Import Questions (High Performance & Error Resilient)
// =========================================================================

export async function bulkImportQuestions(
  targetQuizId: string,
  sourceQuestions: any[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: boolean; count: number }> {
  const supabase = createClient();
  const total = sourceQuestions.length;
  if (total === 0) return { success: true, count: 0 };

  // Map each unique passage_id to a new unique group ID so questions stay grouped in the target quiz
  const passageIdMap = new Map<string, string>();
  sourceQuestions.forEach((q) => {
    if (q.passage_id && !passageIdMap.has(q.passage_id)) {
      passageIdMap.set(
        q.passage_id,
        `passage_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      );
    }
  });

  // Determine starting order_num so imported questions follow existing ones
  let baseOrder = 0;
  try {
    const { data: existingQ } = await supabase
      .from("questions")
      .select("order_num")
      .eq("quiz_id", targetQuizId)
      .order("order_num", { ascending: false })
      .limit(1);
    if (existingQ && existingQ.length > 0 && typeof existingQ[0].order_num === "number") {
      baseOrder = existingQ[0].order_num + 1;
    }
  } catch (e) {
    // If order_num column is not present or query fails, order from 0
    baseOrder = 0;
  }

  const CHUNK_SIZE = 25; // 25 questions per batch chunk is lightning fast & robust against network drops
  let importedCount = 0;

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = sourceQuestions.slice(i, i + CHUNK_SIZE);

    // 1. Prepare Question Payloads
    const extendedQuestionsPayload = chunk.map((q, idx) => ({
      quiz_id: targetQuizId,
      type: q.type || "mcq",
      min_words: q.type === "paragraph" ? (q.min_words ?? 150) : null,
      max_words: q.type === "paragraph" ? (q.max_words ?? 180) : null,
      question_text: q.question_text || null,
      question_image: q.question_image || null,
      correct_option: q.type === "paragraph" ? null : (q.correct_option || "A"),
      passage_id: q.passage_id ? passageIdMap.get(q.passage_id) || null : null,
      passage_title: q.passage_title || null,
      passage_text: q.passage_text || null,
      order_num: baseOrder + i + idx,
    }));

    const baseQuestionsPayload = chunk.map((q) => ({
      quiz_id: targetQuizId,
      question_text: q.question_text || null,
      question_image: q.question_image || null,
      correct_option: q.type === "paragraph" ? "A" : (q.correct_option || "A"),
    }));

    let insertedQuestions: any[] = [];

    // Try inserting with extended columns first
    const { data: extData, error: extError } = await supabase
      .from("questions")
      .insert(extendedQuestionsPayload)
      .select();

    if (extError) {
      // Fallback to base columns if extended columns (passage/order_num) don't exist yet
      console.warn("Extended insert failed, falling back to base columns:", extError.message);
      const { data: baseData, error: baseError } = await supabase
        .from("questions")
        .insert(baseQuestionsPayload)
        .select();

      if (baseError) {
        const errorMsg = baseError.message || baseError.details || JSON.stringify(baseError);
        throw new Error(`خطأ في إدخال دفعة الأسئلة (${i + 1}-${i + chunk.length}): ${errorMsg}`);
      }
      insertedQuestions = baseData || [];
    } else {
      insertedQuestions = extData || [];
    }

    if (!insertedQuestions || insertedQuestions.length === 0) {
      throw new Error(`تعذر حفظ دفعة الأسئلة (${i + 1}-${i + chunk.length}) في قاعدة البيانات.`);
    }

    // 2. Prepare and Batch Insert Options for this chunk
    const allOptionsPayload: any[] = [];
    insertedQuestions.forEach((insertedQ, qIdx) => {
      const sourceQ = chunk[qIdx];
      if (sourceQ && sourceQ.options && Array.isArray(sourceQ.options)) {
        sourceQ.options.forEach((opt: any) => {
          allOptionsPayload.push({
            question_id: insertedQ.id,
            option_letter: opt.option_letter,
            option_text: opt.option_text || null,
            option_image: opt.option_image || null,
          });
        });
      }
    });

    if (allOptionsPayload.length > 0) {
      const { error: optError } = await supabase
        .from("options")
        .upsert(allOptionsPayload, { onConflict: "question_id,option_letter" });

      if (optError) {
        console.warn("Options upsert warning, retrying with insert:", optError.message);
        const { error: insertOptErr } = await supabase
          .from("options")
          .insert(allOptionsPayload);
        if (insertOptErr) {
          const optErrMsg = insertOptErr.message || insertOptErr.details || JSON.stringify(insertOptErr);
          throw new Error(`خطأ في إدخال اختيارات الأسئلة: ${optErrMsg}`);
        }
      }
    }

    importedCount += chunk.length;
    if (onProgress) {
      onProgress(importedCount, total);
    }
  }

  return { success: true, count: importedCount };
}

// =========================================================================
// 4. Student Performance Reporting for Admins
// =========================================================================

export async function getCourseStudentPerformance(courseId: string) {
  const supabase = createClient();

  // 1. Get all students subscribed or granted access to this course
  const [{ data: subscriptions, error: subError }, { data: courseAccessList, error: caError }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(`
        user_id,
        status,
        profiles:user_id (id, full_name, email, phone, grade)
      `)
      .eq("course_id", courseId)
      .eq("status", "approved"),
    supabase
      .from("course_access")
      .select(`
        student_id,
        status,
        profiles:student_id (id, full_name, email, phone, grade)
      `)
      .eq("course_id", courseId)
  ]);

  if (subError) throw subError;
  if (caError) {
    console.warn("Error fetching course_access in getCourseStudentPerformance:", caError);
  }

  const studentMap = new Map<string, any>();
  const revokedSet = new Set<string>();

  (courseAccessList || []).forEach((ca: any) => {
    if (ca.status === "revoked" && ca.student_id) {
      revokedSet.add(ca.student_id);
    } else if (ca.status === "active" && ca.profiles) {
      studentMap.set(ca.profiles.id, ca.profiles);
    }
  });

  (subscriptions || []).forEach((sub: any) => {
    if (sub.profiles && !revokedSet.has(sub.profiles.id)) {
      studentMap.set(sub.profiles.id, sub.profiles);
    }
  });

  // Remove any revoked student that might have been added
  revokedSet.forEach((id) => studentMap.delete(id));

  const students = Array.from(studentMap.values());

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

    // Final exams stats (all final exams for this course)
    const finalExamsResults = finalExams.map((fq: any) => {
      const key = `${std.id}_${fq.id}`;
      const userFinalAttempts = attemptsMap.get(key) || [];
      const attemptsCount = userFinalAttempts.length;

      if (attemptsCount > 0) {
        const lastAtt = userFinalAttempts[0];
        const highestScore = Math.max(...userFinalAttempts.map((a: any) => Number(a.score)));
        const passed = userFinalAttempts.some((a: any) => Number(a.score) >= fq.passing_score);

        return {
          quizId: fq.id,
          quizTitle: fq.title,
          status: "submitted",
          score: lastAtt.score,
          highestScore,
          passed,
          attemptsCount,
          correctCount: lastAtt.correct_count,
          totalQuestions: lastAtt.total_questions,
          submittedAt: lastAtt.submitted_at,
          attempts: userFinalAttempts.map((a: any) => ({
            score: a.score,
            correctCount: a.correct_count,
            totalQuestions: a.total_questions,
            submittedAt: a.submitted_at,
          }))
        };
      } else {
        return {
          quizId: fq.id,
          quizTitle: fq.title,
          status: "not_started",
          score: null,
          highestScore: null,
          passed: false,
          attemptsCount: 0,
          correctCount: null,
          totalQuestions: null,
          submittedAt: null,
          attempts: []
        };
      }
    });

    const finalExamResult = finalExamsResults.length > 0 ? finalExamsResults[0] : null;

    return {
      student: std,
      progress,
      quizzesResult,
      finalExamsResults,
      finalExamResult
    };
  });
}
