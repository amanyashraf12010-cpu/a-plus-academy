import { createClient } from "@/utils/supabase/client";
import { createClient as createIsolatedClient } from "@supabase/supabase-js";

// =========================================================================
// 1. Assistant Profile & Verification
// =========================================================================

export async function getAssistantProfile() {
  const supabase = createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("يجب تسجيل الدخول أولاً.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, teachers(*)")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("لم يتم العثور على الملف الشخصي للمساعدة.");
  }

  if (profile.role !== "assistant" && profile.role !== "admin") {
    throw new Error("غير مصرح لك بالدخول إلى لوحة تحكم المساعدين.");
  }

  return { user, profile, teacher: profile.teachers };
}

// =========================================================================
// 2. Assistant Dashboard Statistics
// =========================================================================

export async function getAssistantDashboardStats() {
  const supabase = createClient();
  const { profile } = await getAssistantProfile();

  const teacherId = profile.teacher_id;
  if (!teacherId && profile.role !== "admin") {
    return {
      coursesCount: 0,
      studentsCount: 0,
      uploadedVideos: 0,
      missingVideos: 0,
      addedQuizzes: 0,
      missingQuizzes: 0,
      addedHomeworks: 0,
      missingHomeworks: 0,
    };
  }

  // 1. Courses for this teacher
  let coursesQuery = supabase.from("courses").select("id, title");
  if (teacherId) {
    coursesQuery = coursesQuery.eq("teacher_id", teacherId);
  }
  const { data: courses, error: coursesErr } = await coursesQuery;
  if (coursesErr) throw coursesErr;

  const courseIds = (courses || []).map((c: any) => c.id);

  if (courseIds.length === 0) {
    return {
      coursesCount: 0,
      studentsCount: 0,
      uploadedVideos: 0,
      missingVideos: 0,
      addedQuizzes: 0,
      missingQuizzes: 0,
      addedHomeworks: 0,
      missingHomeworks: 0,
    };
  }

  // 2. Total Approved Students
  const { data: subscriptions, error: subsErr } = await supabase
    .from("subscriptions")
    .select("user_id")
    .in("course_id", courseIds)
    .eq("status", "approved");

  if (subsErr) throw subsErr;

  const uniqueStudents = new Set((subscriptions || []).map((s: any) => s.user_id));
  const studentsCount = uniqueStudents.size;

  // 3. Lessons for these courses
  const { data: lessons, error: lessonsErr } = await supabase
    .from("lessons")
    .select("id, course_id, title, video_url, pdf_url")
    .in("course_id", courseIds);

  if (lessonsErr) throw lessonsErr;

  const totalLessons = lessons?.length || 0;
  let uploadedVideos = 0;
  let missingVideos = 0;

  (lessons || []).forEach((l: any) => {
    if (l.video_url && l.video_url.trim() !== "") {
      uploadedVideos++;
    } else {
      missingVideos++;
    }
  });

  // 4. Quizzes & Homeworks for these courses
  const { data: quizzes, error: quizzesErr } = await supabase
    .from("quizzes")
    .select("id, lesson_id, type")
    .in("course_id", courseIds);

  if (quizzesErr) throw quizzesErr;

  const lessonQuizSet = new Set(
    (quizzes || [])
      .filter((q: any) => q.type === "quiz" && q.lesson_id)
      .map((q: any) => q.lesson_id)
  );

  let addedHomeworks = 0;
  (lessons || []).forEach((l: any) => {
    if (lessonQuizSet.has(l.id) || (l.pdf_url && l.pdf_url.trim() !== "")) {
      addedHomeworks++;
    }
  });

  const missingHomeworks = Math.max(0, totalLessons - addedHomeworks);

  return {
    coursesCount: courses?.length || 0,
    studentsCount,
    uploadedVideos,
    missingVideos,
    addedHomeworks,
    missingHomeworks,
  };
}

// =========================================================================
// 3. Courses & Lessons for Assistant
// =========================================================================

export async function getAssistantCourses() {
  const supabase = createClient();
  const { profile } = await getAssistantProfile();

  const teacherId = profile.teacher_id;
  let query = supabase
    .from("courses")
    .select("*, teachers(name), lessons(id, title), quizzes(id, type)")
    .order("created_at", { ascending: false });

  if (teacherId) {
    query = query.eq("teacher_id", teacherId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAssistantCourse(courseId: string) {
  const supabase = createClient();
  const { profile } = await getAssistantProfile();

  const { data: course, error } = await supabase
    .from("courses")
    .select("*, teachers(name)")
    .eq("id", courseId)
    .single();

  if (error) throw error;

  // Verify access
  if (profile.teacher_id && course.teacher_id !== profile.teacher_id) {
    throw new Error("غير مصرح لك بالوصول إلى هذا الكورس.");
  }

  return course;
}

export async function getAssistantLessons(courseId: string) {
  const supabase = createClient();
  // Validate course ownership first
  await getAssistantCourse(courseId);

  // 1. Fetch lessons
  const { data: lessons, error: lessonsErr } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order", { ascending: true });

  if (lessonsErr) throw lessonsErr;

  // 2. Fetch quizzes for this course
  const { data: quizzes, error: quizzesErr } = await supabase
    .from("quizzes")
    .select("id, lesson_id, title, is_active, passing_score, duration, type, questions(id)")
    .eq("course_id", courseId);

  if (quizzesErr) console.warn("تعذر جلب كويزات الكورس:", quizzesErr.message);

  const quizMap = new Map<string, any>();
  (quizzes || []).forEach((q: any) => {
    if (q.lesson_id) {
      quizMap.set(q.lesson_id, q);
    }
  });

  return (lessons || []).map((l: any) => {
    const quiz = quizMap.get(l.id) || null;
    const hasQuiz = Boolean(quiz && (quiz.questions?.length > 0 || quiz.id));
    const hasHomework = hasQuiz || Boolean(l.pdf_url && l.pdf_url.trim() !== "");

    return {
      ...l,
      quiz,
      hasQuiz,
      hasHomework,
    };
  });
}

// =========================================================================
// 4. Student Tracking & Performance with Arabic Filters
// =========================================================================

export type StudentFilterType =
  | "all"
  | "watched_video"
  | "not_watched_video"
  | "submitted_homework"
  | "not_submitted_homework";

export async function getAssistantStudentsReport(courseId?: string, filter: StudentFilterType = "all") {
  const supabase = createClient();
  const { profile } = await getAssistantProfile();
  const teacherId = profile.teacher_id;

  // 1. Get teacher courses
  let coursesQuery = supabase.from("courses").select("id, title");
  if (teacherId) {
    coursesQuery = coursesQuery.eq("teacher_id", teacherId);
  }
  if (courseId && courseId !== "all") {
    coursesQuery = coursesQuery.eq("id", courseId);
  }
  const { data: teacherCourses, error: cErr } = await coursesQuery;
  if (cErr) throw cErr;

  const courseIds = (teacherCourses || []).map((c: any) => c.id);
  if (courseIds.length === 0) return [];

  // 2. Fetch approved subscriptions
  const { data: subscriptions, error: sErr } = await supabase
    .from("subscriptions")
    .select(`
      user_id,
      course_id,
      created_at,
      profiles:user_id (id, full_name, phone, parent_phone, school, governorate, grade),
      courses:course_id (id, title)
    `)
    .in("course_id", courseIds)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (sErr) throw sErr;
  if (!subscriptions || subscriptions.length === 0) return [];

  // 3. Fetch lessons for these courses
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, course_id, title, pdf_url")
    .in("course_id", courseIds);

  const lessonIds = (lessons || []).map((l: any) => l.id);

  // 4. Fetch video progress
  const userIds = subscriptions.map((s: any) => s.user_id);
  const { data: videoProgress } = await supabase
    .from("video_progress")
    .select("user_id, lesson_id, views_count")
    .in("user_id", userIds)
    .in("lesson_id", lessonIds);

  const vpMap = new Map<string, number>();
  (videoProgress || []).forEach((vp: any) => {
    vpMap.set(`${vp.user_id}_${vp.lesson_id}`, vp.views_count || 0);
  });

  // 5. Fetch quizzes and attempts (which represent homeworks)
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, course_id, lesson_id, type, passing_score")
    .in("course_id", courseIds)
    .eq("is_active", true);

  const quizIds = (quizzes || []).map((q: any) => q.id);

  let attemptsData: any[] = [];
  if (quizIds.length > 0) {
    const { data: atts } = await supabase
      .from("student_quiz_attempts")
      .select("id, user_id, quiz_id, score, status, submitted_at, correct_count, total_questions")
      .in("user_id", userIds)
      .in("quiz_id", quizIds)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false });
    attemptsData = atts || [];
  }

  const attemptsMap = new Map<string, any[]>();
  attemptsData.forEach((att: any) => {
    const key = `${att.user_id}_${att.quiz_id}`;
    if (!attemptsMap.has(key)) attemptsMap.set(key, []);
    attemptsMap.get(key)!.push(att);
  });

  // 6. Build Student Detailed Records
  const reportList = subscriptions.map((sub: any) => {
    const student = sub.profiles;
    const course = sub.courses;
    const courseLessons = (lessons || []).filter((l: any) => l.course_id === sub.course_id);
    const courseQuizzes = (quizzes || []).filter((q: any) => q.course_id === sub.course_id);

    // Watched lectures
    let watchedLessonsCount = 0;
    let totalViewsCount = 0;
    const watchedLessonsTitles: string[] = [];
    const unwatchedLessonsTitles: string[] = [];

    courseLessons.forEach((l: any) => {
      const views = vpMap.get(`${student?.id}_${l.id}`) || 0;
      totalViewsCount += views;
      if (views > 0) {
        watchedLessonsCount++;
        watchedLessonsTitles.push(l.title);
      } else {
        unwatchedLessonsTitles.push(l.title);
      }
    });

    // Homework solutions
    let completedHomeworkCount = 0;
    let passedHomeworkCount = 0;
    const homeworkScores: Array<{ quizId: string; score: number; passed: boolean }> = [];

    courseQuizzes.forEach((q: any) => {
      const atts = attemptsMap.get(`${student?.id}_${q.id}`) || [];
      if (atts.length > 0) {
        completedHomeworkCount++;
        const bestScore = Math.max(...atts.map((a: any) => Number(a.score)));
        const passed = bestScore >= q.passing_score;
        if (passed) passedHomeworkCount++;
        homeworkScores.push({ quizId: q.id, score: bestScore, passed });
      }
    });

    const hasSubmittedHomework = completedHomeworkCount > 0;

    // Completion Progress %
    const totalItems = Math.max(1, courseLessons.length);
    const progressPercent = Math.min(100, Math.round((watchedLessonsCount / totalItems) * 100));

    return {
      studentId: student?.id,
      studentName: student?.full_name || "طالب بدون اسم",
      phone: student?.phone || "-",
      parentPhone: student?.parent_phone || "-",
      courseId: course?.id,
      courseTitle: course?.title || "-",
      progress: progressPercent,
      watchedLessonsCount,
      totalLessonsCount: courseLessons.length,
      watchedLessonsTitles,
      unwatchedLessonsTitles,
      totalViewsCount,
      hasWatchedVideo: watchedLessonsCount > 0,
      hasSubmittedHomework,
      completedHomeworkCount,
      totalHomeworkCount: courseQuizzes.length,
      homeworkScores,
    };
  });

  // 7. Apply Filters in Arabic context
  return reportList.filter((item: any) => {
    if (filter === "watched_video") return item.hasWatchedVideo;
    if (filter === "not_watched_video") return !item.hasWatchedVideo;
    if (filter === "submitted_homework") return item.hasSubmittedHomework;
    if (filter === "not_submitted_homework") return !item.hasSubmittedHomework;
    return true; // 'all'
  });
}

// =========================================================================
// 5. Content Review Audit Checklist
// =========================================================================

export async function getAssistantContentReview(courseId?: string) {
  const supabase = createClient();
  const { profile } = await getAssistantProfile();
  const teacherId = profile.teacher_id;

  let coursesQuery = supabase.from("courses").select("id, title");
  if (teacherId) {
    coursesQuery = coursesQuery.eq("teacher_id", teacherId);
  }
  if (courseId && courseId !== "all") {
    coursesQuery = coursesQuery.eq("id", courseId);
  }

  const { data: teacherCourses, error: cErr } = await coursesQuery;
  if (cErr) throw cErr;

  const courseIds = (teacherCourses || []).map((c: any) => c.id);
  if (courseIds.length === 0) return [];

  // Fetch all lessons for these courses
  const { data: lessons, error: lErr } = await supabase
    .from("lessons")
    .select(`
      id,
      course_id,
      title,
      order,
      video_url,
      pdf_url,
      publish_at,
      courses:course_id (id, title)
    `)
    .in("course_id", courseIds)
    .order("order", { ascending: true });

  if (lErr) throw lErr;

  // Fetch quizzes (which are homeworks) for these lessons
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, lesson_id, type, is_active, title, passing_score")
    .in("course_id", courseIds);

  const quizLessonMap = new Map<string, any>();
  (quizzes || []).forEach((q: any) => {
    if (q.lesson_id) {
      quizLessonMap.set(q.lesson_id, q);
    }
  });

  return (lessons || []).map((l: any) => {
    const hasVideo = Boolean(l.video_url && l.video_url.trim() !== "");
    const quiz = quizLessonMap.get(l.id);
    const hasHomework = Boolean(quiz && quiz.is_active) || Boolean(l.pdf_url && l.pdf_url.trim() !== "");
    const isComplete = hasVideo && hasHomework;

    return {
      lessonId: l.id,
      lessonTitle: l.title,
      order: l.order,
      courseId: l.courses?.id || l.course_id,
      courseTitle: l.courses?.title || "-",
      publishAt: l.publish_at,
      hasVideo,
      hasHomework,
      homeworkDetails: quiz || null,
      homeworkPdf: l.pdf_url || null,
      isComplete,
    };
  });
}

// =========================================================================
// 6. Admin API for Assistant Management
// =========================================================================

export async function getAssistantsList() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*, teachers(id, name, subject)")
    .eq("role", "assistant")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createAssistantAccount(formData: {
  name: string;
  email: string;
  password: string;
  teacher_id: string;
  phone?: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Create isolated in-memory client without touching active admin session
  const isolatedSupabase = createIsolatedClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await isolatedSupabase.auth.signUp({
    email: formData.email.trim(),
    password: formData.password,
    options: {
      data: {
        full_name: formData.name.trim(),
        role: "assistant",
        teacher_id: formData.teacher_id,
        phone: formData.phone || "01000000000",
        parent_phone: "01000000001",
        is_approved: true,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

export async function deleteAssistantAccount(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id)
    .eq("role", "assistant");

  if (error) throw error;
}

export async function updateAssistantTeacher(id: string, teacherId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ teacher_id: teacherId })
    .eq("id", id)
    .eq("role", "assistant");

  if (error) throw error;
}
