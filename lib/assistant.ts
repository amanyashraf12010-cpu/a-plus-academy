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
// 2. Assistant Home Summary Stats (Clean & Simple)
// =========================================================================

export async function getAssistantHomeStats() {
  const supabase = createClient();
  const { profile } = await getAssistantProfile();

  const teacherId = profile.teacher_id;
  if (!teacherId && profile.role !== "admin") {
    return { coursesCount: 0, studentsCount: 0 };
  }

  // 1. Courses for this teacher
  let coursesQuery = supabase.from("courses").select("id");
  if (teacherId) {
    coursesQuery = coursesQuery.eq("teacher_id", teacherId);
  }
  const { data: courses, error: coursesErr } = await coursesQuery;
  if (coursesErr) throw coursesErr;

  const courseIds = (courses || []).map((c: any) => c.id);
  if (courseIds.length === 0) {
    return { coursesCount: 0, studentsCount: 0 };
  }

  // 2. Total Approved Students
  const { data: subscriptions, error: subsErr } = await supabase
    .from("subscriptions")
    .select("user_id")
    .in("course_id", courseIds)
    .eq("status", "approved");

  if (subsErr) throw subsErr;

  const uniqueStudents = new Set((subscriptions || []).map((s: any) => s.user_id));

  return {
    coursesCount: courses?.length || 0,
    studentsCount: uniqueStudents.size,
  };
}

// =========================================================================
// 3. Courses for Assigned Teacher Only
// =========================================================================

export async function getAssistantCourses() {
  const supabase = createClient();
  const { profile } = await getAssistantProfile();

  const teacherId = profile.teacher_id;
  let query = supabase
    .from("courses")
    .select("*, teachers(name, subject), lessons(id, video_url)")
    .order("created_at", { ascending: false });

  if (teacherId) {
    query = query.eq("teacher_id", teacherId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAssistantCourseDetails(courseId: string) {
  const supabase = createClient();
  const { profile } = await getAssistantProfile();

  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("*, teachers(name, subject)")
    .eq("id", courseId)
    .single();

  if (courseErr || !course) {
    throw new Error("لم يتم العثور على الكورس المطلوب.");
  }

  // Strict Teacher Isolation:
  if (profile.role !== "admin" && profile.teacher_id && course.teacher_id !== profile.teacher_id) {
    throw new Error("غير مصرح لك بالوصول إلى كورسات مدرس آخر.");
  }

  // Fetch lessons
  const { data: lessons, error: lessonsErr } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order", { ascending: true });

  if (lessonsErr) throw lessonsErr;

  const formattedLessons = (lessons || []).map((l: any) => ({
    ...l,
    hasVideo: Boolean(l.video_url && l.video_url.trim() !== ""),
  }));

  return { course, lessons: formattedLessons };
}

// =========================================================================
// 4. Students for Assigned Teacher Only
// =========================================================================

export interface AssistantStudentItem {
  id: string;
  fullName: string;
  phone: string;
  parentPhone: string;
  school?: string;
  governorate?: string;
  grade?: string;
  enrolledCourses: Array<{ id: string; title: string }>;
}

export async function getAssistantStudents(): Promise<AssistantStudentItem[]> {
  const supabase = createClient();
  const { profile } = await getAssistantProfile();
  const teacherId = profile.teacher_id;

  // 1. Get teacher courses
  let coursesQuery = supabase.from("courses").select("id, title");
  if (teacherId) {
    coursesQuery = coursesQuery.eq("teacher_id", teacherId);
  }
  const { data: teacherCourses, error: cErr } = await coursesQuery;
  if (cErr) throw cErr;

  const courseIds = (teacherCourses || []).map((c: any) => c.id);
  if (courseIds.length === 0) return [];

  // 2. Fetch approved subscriptions with profiles & courses
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

  // 3. Group by student
  const studentMap = new Map<string, AssistantStudentItem>();

  for (const sub of subscriptions as any[]) {
    const student = sub.profiles;
    if (!student || !student.id) continue;

    if (!studentMap.has(student.id)) {
      studentMap.set(student.id, {
        id: student.id,
        fullName: student.full_name || "طالب بدون اسم",
        phone: student.phone || "غير مسجل",
        parentPhone: student.parent_phone || "غير مسجل",
        school: student.school || "",
        governorate: student.governorate || "",
        grade: student.grade || "",
        enrolledCourses: [],
      });
    }

    const current = studentMap.get(student.id)!;
    if (sub.courses && !current.enrolledCourses.some((c) => c.id === sub.courses.id)) {
      current.enrolledCourses.push({
        id: sub.courses.id,
        title: sub.courses.title,
      });
    }
  }

  return Array.from(studentMap.values());
}

// =========================================================================
// 5. Single Student Full Details & Progress (Videos, Homeworks, Quizzes)
// =========================================================================

export async function getAssistantStudentDetails(studentId: string) {
  const supabase = createClient();
  const { profile } = await getAssistantProfile();
  const teacherId = profile.teacher_id;

  // 1. Fetch student profile
  const { data: student, error: studentErr } = await supabase
    .from("profiles")
    .select("id, full_name, phone, parent_phone, school, governorate, grade")
    .eq("id", studentId)
    .single();

  if (studentErr || !student) {
    throw new Error("لم يتم العثور على بيانات الطالب.");
  }

  // 2. Fetch approved courses for this student that belong to this teacher
  let coursesQuery = supabase
    .from("subscriptions")
    .select(`
      course_id,
      courses:course_id (id, title, teacher_id, grade, subject)
    `)
    .eq("user_id", studentId)
    .eq("status", "approved");

  const { data: subs, error: subsErr } = await coursesQuery;
  if (subsErr) throw subsErr;

  let enrolledTeacherCourses: any[] = [];
  (subs || []).forEach((s: any) => {
    if (s.courses) {
      if (profile.role === "admin" || !teacherId || s.courses.teacher_id === teacherId) {
        enrolledTeacherCourses.push(s.courses);
      }
    }
  });

  if (profile.role !== "admin" && teacherId && enrolledTeacherCourses.length === 0) {
    throw new Error("هذا الطالب غير مشترك في أي كورس من كورسات المدرس الخاص بك.");
  }

  return { student, courses: enrolledTeacherCourses };
}

export interface StudentCourseProgressData {
  videos: Array<{
    lessonId: string;
    lessonTitle: string;
    order: number;
    hasVideo: boolean;
    videoUrl?: string;
    isWatched: boolean;
    viewsCount: number;
  }>;
  homeworks: Array<{
    lessonId: string;
    lessonTitle: string;
    order: number;
    hasHomework: boolean;
    quizId?: string;
    isSubmitted: boolean;
    score?: number;
    scoreText: string;
    correctCount?: number;
    totalQuestions?: number;
  }>;
  quizzes: Array<{
    quizId: string;
    quizTitle: string;
    type: "quiz" | "final";
    lessonTitle?: string;
    isSubmitted: boolean;
    score?: number;
    scoreText: string;
    correctCount?: number;
    totalQuestions?: number;
    passingScore?: number;
  }>;
}

export async function getAssistantStudentCourseProgress(
  studentId: string,
  courseId: string
): Promise<StudentCourseProgressData> {
  const supabase = createClient();
  const { profile } = await getAssistantProfile();
  const teacherId = profile.teacher_id;

  // 1. Verify Course Ownership
  const { data: course, error: cErr } = await supabase
    .from("courses")
    .select("id, teacher_id, title")
    .eq("id", courseId)
    .single();

  if (cErr || !course) throw new Error("الكورس غير موجود.");

  if (profile.role !== "admin" && teacherId && course.teacher_id !== teacherId) {
    throw new Error("غير مصرح لك بالوصول لكورسات مدرس آخر.");
  }

  // 2. Fetch Lessons
  const { data: lessons, error: lErr } = await supabase
    .from("lessons")
    .select("id, title, order, video_url, pdf_url")
    .eq("course_id", courseId)
    .order("order", { ascending: true });

  if (lErr) throw lErr;
  const lessonList: any[] = lessons || [];
  const lessonIds = lessonList.map((l: any) => l.id);

  // 3. Fetch Video Progress
  let vpMap = new Map<string, number>();
  if (lessonIds.length > 0) {
    const { data: vpData } = await supabase
      .from("video_progress")
      .select("lesson_id, views_count")
      .eq("user_id", studentId)
      .in("lesson_id", lessonIds);

    (vpData || []).forEach((vp: any) => {
      vpMap.set(vp.lesson_id, vp.views_count || 0);
    });
  }

  // 4. Fetch Quizzes (Lesson Homeworks + Final Exams)
  const { data: quizzes, error: qErr } = await supabase
    .from("quizzes")
    .select("id, lesson_id, title, type, passing_score, is_active")
    .eq("course_id", courseId);

  if (qErr) throw qErr;
  const quizList: any[] = quizzes || [];
  const quizIds = quizList.map((q: any) => q.id);

  // 5. Fetch Student Attempts
  let attemptsMap = new Map<string, any>();
  if (quizIds.length > 0) {
    const { data: attempts, error: aErr } = await supabase
      .from("student_quiz_attempts")
      .select("*")
      .eq("user_id", studentId)
      .in("quiz_id", quizIds)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false });

    if (aErr) throw aErr;

    // Pick best/latest attempt for each quiz
    (attempts || []).forEach((att: any) => {
      if (!attemptsMap.has(att.quiz_id)) {
        attemptsMap.set(att.quiz_id, att);
      } else {
        const existing = attemptsMap.get(att.quiz_id);
        if (Number(att.score) > Number(existing.score)) {
          attemptsMap.set(att.quiz_id, att);
        }
      }
    });
  }

  // 6. Build Videos Table Data
  const videos = lessonList.map((lesson: any, idx: number) => {
    const views = vpMap.get(lesson.id) || 0;
    const hasVideo = Boolean(lesson.video_url && lesson.video_url.trim() !== "");
    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      order: lesson.order || idx + 1,
      hasVideo,
      videoUrl: lesson.video_url || undefined,
      isWatched: views > 0,
      viewsCount: views,
    };
  });

  // 7. Build Homeworks Table Data (Lesson Quizzes or Lesson Attachments)
  const lessonQuizMap = new Map<string, any>();
  quizList.forEach((q: any) => {
    if (q.lesson_id) {
      lessonQuizMap.set(q.lesson_id, q);
    }
  });

  const homeworks = lessonList.map((lesson: any, idx: number) => {
    const quiz = lessonQuizMap.get(lesson.id);
    const hasPdf = Boolean(lesson.pdf_url && lesson.pdf_url.trim() !== "");
    const hasHomework = Boolean(quiz || hasPdf);

    let isSubmitted = false;
    let scoreText = "—";
    let score: number | undefined = undefined;
    let correctCount: number | undefined = undefined;
    let totalQuestions: number | undefined = undefined;

    if (quiz) {
      const att = attemptsMap.get(quiz.id);
      if (att) {
        isSubmitted = true;
        score = Number(att.score);
        correctCount = att.correct_count;
        totalQuestions = att.total_questions;
        if (totalQuestions !== undefined && totalQuestions > 0) {
          scoreText = `${correctCount} / ${totalQuestions} (${score}%)`;
        } else {
          scoreText = `${score}%`;
        }
      }
    }

    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      order: lesson.order || idx + 1,
      hasHomework,
      quizId: quiz?.id,
      isSubmitted,
      score,
      scoreText,
      correctCount,
      totalQuestions,
    };
  });

  // 8. Build Quizzes & Exams Table Data
  const lessonTitleMap = new Map<string, string>();
  lessonList.forEach((l: any) => lessonTitleMap.set(l.id, l.title));

  const quizzesData = quizList.map((quiz: any) => {
    const att = attemptsMap.get(quiz.id);
    const isSubmitted = Boolean(att);
    let scoreText = "—";
    let score: number | undefined = undefined;
    let correctCount: number | undefined = undefined;
    let totalQuestions: number | undefined = undefined;

    if (att) {
      score = Number(att.score);
      correctCount = att.correct_count;
      totalQuestions = att.total_questions;
      if (totalQuestions !== undefined && totalQuestions > 0) {
        scoreText = `${correctCount} / ${totalQuestions} (${score}%)`;
      } else {
        scoreText = `${score}%`;
      }
    }

    return {
      quizId: quiz.id,
      quizTitle: quiz.title,
      type: (quiz.type || "quiz") as "quiz" | "final",
      lessonTitle: quiz.lesson_id ? lessonTitleMap.get(quiz.lesson_id) : "امتحان شامل للكورس",
      isSubmitted,
      score,
      scoreText,
      correctCount,
      totalQuestions,
      passingScore: quiz.passing_score,
    };
  });

  return {
    videos,
    homeworks,
    quizzes: quizzesData,
  };
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

  // Create isolated client to prevent interfering with active admin session
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
