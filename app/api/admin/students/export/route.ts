import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

// Helper grade translations
function mapGradeToArabic(grade: string | null | undefined): string {
  if (!grade) return "غير محدد";
  switch (grade) {
    case "first":
      return "الصف الأول الثانوي";
    case "second":
      return "الصف الثاني الثانوي";
    case "third":
      return "الصف الثالث الثانوي";
    case "prep3":
      return "الصف الثالث الإعدادي";
    default:
      return grade;
  }
}

// Helper education system translations
function mapEducationSystemToArabic(sys: string | null | undefined, grade: string | null | undefined): string {
  if (!sys) return "غير محدد";
  const isPrep = grade === "prep3";
  const prefix = isPrep ? "إعدادي" : "ثانوي";
  switch (sys) {
    case "general":
      return `${prefix} عام`;
    case "azhar":
      return `${prefix} أزهر`;
    case "general_baccalaureate":
      return `${prefix} عام (بكالوريا)`;
    case "azhar_baccalaureate":
      return `${prefix} أزهر (بكالوريا)`;
    default:
      return sys;
  }
}

// Helper gender translations
function mapGenderToArabic(gender: string | null | undefined): string {
  if (!gender) return "غير محدد";
  if (gender === "male") return "ذكر";
  if (gender === "female") return "أنثى";
  return gender;
}

// Column definition interface
interface ExportColumnDef {
  key: string;
  header: string;
  category: "basic" | "courses" | "progress";
  width: number;
  align: "right" | "center" | "left";
}

export const ALL_EXPORT_COLUMNS: ExportColumnDef[] = [
  // 1. Basic Info
  { key: "id", header: "كود الطالب (ID)", category: "basic", width: 36, align: "center" },
  { key: "full_name", header: "اسم الطالب", category: "basic", width: 25, align: "right" },
  { key: "email", header: "البريد الإلكتروني", category: "basic", width: 28, align: "left" },
  { key: "phone", header: "رقم الهاتف", category: "basic", width: 16, align: "center" },
  { key: "parent_phone", header: "رقم ولي الأمر", category: "basic", width: 16, align: "center" },
  { key: "parent_job", header: "وظيفة ولي الأمر", category: "basic", width: 20, align: "right" },
  { key: "school", header: "المدرسة", category: "basic", width: 22, align: "right" },
  { key: "governorate", header: "المحافظة", category: "basic", width: 16, align: "center" },
  { key: "gender", header: "النوع", category: "basic", width: 12, align: "center" },
  { key: "education_system", header: "النظام التعليمي", category: "basic", width: 20, align: "center" },
  { key: "track", header: "الشعبة / المسار", category: "basic", width: 18, align: "center" },
  { key: "grade", header: "الصف الدراسي", category: "basic", width: 20, align: "center" },
  { key: "created_at", header: "تاريخ التسجيل", category: "basic", width: 20, align: "center" },
  { key: "is_approved", header: "حالة الحساب", category: "basic", width: 15, align: "center" },

  // 2. Course & Subscription Info
  { key: "courses", header: "الكورسات المشترك بها", category: "courses", width: 35, align: "right" },
  { key: "course_count", header: "عدد الكورسات", category: "courses", width: 14, align: "center" },
  { key: "subscription_status", header: "حالة الاشتراك", category: "courses", width: 15, align: "center" },

  // 3. Progress & Quizzes
  { key: "progress_percent", header: "نسبة التقدم الإجمالية (%)", category: "progress", width: 24, align: "center" },
  { key: "completed_lessons", header: "عدد الدروس المكتملة", category: "progress", width: 20, align: "center" },
  { key: "remaining_lessons", header: "عدد الدروس المتبقية", category: "progress", width: 20, align: "center" },
  { key: "quizzes_count", header: "عدد الاختبارات المنجزة", category: "progress", width: 22, align: "center" },
  { key: "average_score", header: "متوسط درجات الاختبارات (%)", category: "progress", width: 26, align: "center" },
  { key: "passed_quizzes", header: "عدد الاختبارات الناجحة", category: "progress", width: 22, align: "center" },
  { key: "failed_quizzes", header: "عدد الاختبارات غير الناجحة", category: "progress", width: 24, align: "center" },
];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "غير مصرح لك. يرجى تسجيل الدخول أولاً." }, { status: 401 });
    }

    // 2. Verify Admin Authorization
    const { data: adminProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, email")
      .eq("id", user.id)
      .single();

    if (profileError || !adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بتصدير البيانات. هذه الميزة متاحة للمسؤولين فقط." },
        { status: 403 }
      );
    }

    // 3. Parse Request Body
    const body = await req.json();
    const {
      scope = "all", // "all" | "current" | "custom"
      studentIds = [], // Array of UUID strings when scope is "current" or selected
      filters = {}, // Filter criteria
      selectedColumns = [], // Array of column keys
    } = body;

    // Validate selected columns
    const columnsToExport = ALL_EXPORT_COLUMNS.filter((col) =>
      selectedColumns.length > 0 ? selectedColumns.includes(col.key) : col.category === "basic"
    );

    if (columnsToExport.length === 0) {
      return NextResponse.json({ error: "يرجى تحديد عمود واحد على الأقل للتصدير." }, { status: 400 });
    }

    const needsCourses = columnsToExport.some((c) => c.category === "courses" || c.category === "progress");
    const needsProgress = columnsToExport.some((c) =>
      ["progress_percent", "completed_lessons", "remaining_lessons"].includes(c.key)
    );
    const needsQuizzes = columnsToExport.some((c) =>
      ["quizzes_count", "average_score", "passed_quizzes", "failed_quizzes"].includes(c.key)
    );

    // 4. Build Student Query
    let studentsQuery = supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("created_at", { ascending: false });

    // Apply Scope / Student IDs
    if (scope === "current" && Array.isArray(studentIds) && studentIds.length > 0) {
      studentsQuery = studentsQuery.in("id", studentIds);
    } else {
      // Apply filters if scope is "all" or "custom"
      if (filters.grade) {
        studentsQuery = studentsQuery.eq("grade", filters.grade);
      }
      if (filters.education_system) {
        studentsQuery = studentsQuery.eq("education_system", filters.education_system);
      }
      if (filters.track) {
        studentsQuery = studentsQuery.eq("track", filters.track);
      }
      if (filters.governorate) {
        studentsQuery = studentsQuery.eq("governorate", filters.governorate);
      }
      if (filters.gender) {
        studentsQuery = studentsQuery.eq("gender", filters.gender);
      }
      if (filters.is_approved !== undefined && filters.is_approved !== "" && filters.is_approved !== "all") {
        const isApprovedBool = filters.is_approved === true || filters.is_approved === "approved" || filters.is_approved === "true";
        studentsQuery = studentsQuery.eq("is_approved", isApprovedBool);
      }
      if (filters.date_from) {
        studentsQuery = studentsQuery.gte("created_at", filters.date_from);
      }
      if (filters.date_to) {
        // Add end of day
        const toDate = new Date(filters.date_to);
        toDate.setHours(23, 59, 59, 999);
        studentsQuery = studentsQuery.lte("created_at", toDate.toISOString());
      }
    }

    // Filter by specific course if requested
    if (filters.course_id) {
      // Find students who have active access or approved subscription to this course
      const [{ data: caStudents }, { data: subStudents }] = await Promise.all([
        supabase
          .from("course_access")
          .select("student_id, status")
          .eq("course_id", filters.course_id),
        supabase
          .from("subscriptions")
          .select("user_id, status")
          .eq("course_id", filters.course_id)
          .eq("status", "approved"),
      ]);

      const revokedMap = new Set<string>();
      const enrolledSet = new Set<string>();

      (caStudents || []).forEach((ca: any) => {
        if (ca.status === "revoked") revokedMap.add(ca.student_id);
        if (ca.status === "active") enrolledSet.add(ca.student_id);
      });

      (subStudents || []).forEach((sub: any) => {
        if (sub.user_id && !revokedMap.has(sub.user_id)) {
          enrolledSet.add(sub.user_id);
        }
      });

      const matchedStudentIds = Array.from(enrolledSet);
      if (matchedStudentIds.length === 0) {
        // No students enrolled in this course
        return generateEmptyWorkbookResponse(adminProfile, columnsToExport, filters);
      }

      studentsQuery = studentsQuery.in("id", matchedStudentIds);
    }

    const { data: studentsList, error: studentsError } = await studentsQuery;

    if (studentsError) {
      console.error("Error fetching students for export:", studentsError);
      return NextResponse.json({ error: "فشل استرجاع بيانات الطلاب: " + studentsError.message }, { status: 500 });
    }

    const students = studentsList || [];
    if (students.length === 0) {
      return generateEmptyWorkbookResponse(adminProfile, columnsToExport, filters);
    }

    const studentIdsList = students.map((s: any) => s.id);

    // 5. Aggregate Courses, Progress & Quizzes if needed
    // Course access map per student
    const studentCoursesMap = new Map<string, Array<{ id: string; title: string; isFullAccess: boolean; accessibleLessonIds: Set<string> }>>();
    const studentAllCourseIds = new Set<string>();

    if (needsCourses) {
      const [{ data: directAccessList }, { data: subsList }, { data: lessonAccessList }] = await Promise.all([
        supabase
          .from("course_access")
          .select("student_id, course_id, status, courses(id, title)")
          .in("student_id", studentIdsList),
        supabase
          .from("subscriptions")
          .select("user_id, course_id, lesson_id, status, courses(id, title)")
          .in("user_id", studentIdsList)
          .eq("status", "approved"),
        supabase
          .from("lesson_access")
          .select("user_id, course_id, lesson_id, courses(id, title)")
          .in("user_id", studentIdsList),
      ]);

      studentIdsList.forEach((sId) => {
        const studentDirect = (directAccessList || []).filter((ca: any) => ca.student_id === sId);
        const studentSubs = (subsList || []).filter((sub: any) => sub.user_id === sId);
        const studentLessons = (lessonAccessList || []).filter((la: any) => la.user_id === sId);

        const activeCourseMap = new Map<string, boolean>();
        const revokedCourseMap = new Map<string, boolean>();

        studentDirect.forEach((ca: any) => {
          if (ca.status === "active") activeCourseMap.set(ca.course_id, true);
          if (ca.status === "revoked") revokedCourseMap.set(ca.course_id, true);
        });

        const studentCourseObjMap = new Map<string, { id: string; title: string; isFullAccess: boolean; accessibleLessonIds: Set<string> }>();

        // A. Direct active course access
        studentDirect.forEach((ca: any) => {
          if (ca.status === "active" && ca.courses) {
            studentCourseObjMap.set(ca.courses.id, {
              id: ca.courses.id,
              title: ca.courses.title || "كورس بدون عنوان",
              isFullAccess: true,
              accessibleLessonIds: new Set<string>(),
            });
            studentAllCourseIds.add(ca.courses.id);
          }
        });

        // B. Approved Subscriptions
        studentSubs.forEach((sub: any) => {
          if (!sub.courses) return;
          const cid = sub.courses.id;
          if (revokedCourseMap.has(cid)) return; // Revoked

          studentAllCourseIds.add(cid);

          if (!studentCourseObjMap.has(cid)) {
            studentCourseObjMap.set(cid, {
              id: cid,
              title: sub.courses.title || "كورس بدون عنوان",
              isFullAccess: !sub.lesson_id,
              accessibleLessonIds: new Set<string>(),
            });
          }
          if (!sub.lesson_id) {
            studentCourseObjMap.get(cid)!.isFullAccess = true;
          } else {
            studentCourseObjMap.get(cid)!.accessibleLessonIds.add(sub.lesson_id);
          }
        });

        // C. Lesson Access
        studentLessons.forEach((la: any) => {
          if (!la.courses) return;
          const cid = la.courses.id;
          studentAllCourseIds.add(cid);

          if (!studentCourseObjMap.has(cid)) {
            studentCourseObjMap.set(cid, {
              id: cid,
              title: la.courses.title || "كورس بدون عنوان",
              isFullAccess: activeCourseMap.has(cid),
              accessibleLessonIds: new Set<string>(),
            });
          }
          studentCourseObjMap.get(cid)!.accessibleLessonIds.add(la.lesson_id);
        });

        studentCoursesMap.set(sId, Array.from(studentCourseObjMap.values()));
      });
    }

    // 6. Aggregate Progress and Quizzes Data
    let lessonsByCourseMap = new Map<string, Array<{ id: string; order: number; course_id: string }>>();
    let videoProgressByStudentMap = new Map<string, Map<string, number>>(); // studentId -> (lessonId -> viewsCount)
    let quizAttemptsByStudentMap = new Map<string, Array<{ quiz_id: string; score: number; passing_score: number; quiz_title: string }>>();

    const relevantCourseIds = Array.from(studentAllCourseIds);

    if (needsProgress && relevantCourseIds.length > 0) {
      const [{ data: allCourseLessons }, { data: allVideoProgress }] = await Promise.all([
        supabase
          .from("lessons")
          .select("id, order, course_id")
          .in("course_id", relevantCourseIds)
          .order("order", { ascending: true }),
        supabase
          .from("video_progress")
          .select("user_id, lesson_id, views_count")
          .in("user_id", studentIdsList),
      ]);

      (allCourseLessons || []).forEach((l: any) => {
        if (!lessonsByCourseMap.has(l.course_id)) {
          lessonsByCourseMap.set(l.course_id, []);
        }
        lessonsByCourseMap.get(l.course_id)!.push(l);
      });

      (allVideoProgress || []).forEach((vp: any) => {
        if (!videoProgressByStudentMap.has(vp.user_id)) {
          videoProgressByStudentMap.set(vp.user_id, new Map<string, number>());
        }
        videoProgressByStudentMap.get(vp.user_id)!.set(vp.lesson_id, vp.views_count || 0);
      });
    }

    if (needsQuizzes) {
      const { data: quizAttempts } = await supabase
        .from("student_quiz_attempts")
        .select("user_id, quiz_id, score, status, quizzes(id, title, passing_score, course_id)")
        .in("user_id", studentIdsList)
        .eq("status", "submitted");

      (quizAttempts || []).forEach((att: any) => {
        if (!quizAttemptsByStudentMap.has(att.user_id)) {
          quizAttemptsByStudentMap.set(att.user_id, []);
        }
        const qData = att.quizzes;
        quizAttemptsByStudentMap.get(att.user_id)!.push({
          quiz_id: att.quiz_id,
          score: Number(att.score) || 0,
          passing_score: Number(qData?.passing_score) || 50,
          quiz_title: qData?.title || "",
        });
      });
    }

    // 7. Construct Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "A+ Academy System";
    workbook.lastModifiedBy = adminProfile.full_name || "Admin";
    workbook.created = new Date();
    workbook.modified = new Date();

    // Sheet 1: Students Data
    const sheet = workbook.addWorksheet("بيانات الطلاب", {
      views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
      properties: { defaultRowHeight: 22 },
    });

    // Define columns
    sheet.columns = columnsToExport.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width,
      style: {
        alignment: {
          vertical: "middle",
          horizontal: col.align,
          wrapText: true,
        },
        font: {
          name: "Calibri",
          size: 10,
          color: { argb: "FF2D2B7A" },
        },
      },
    }));

    // Header Styling
    const headerRow = sheet.getRow(1);
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF7D79F1" }, // A+ Academy brand purple
      };
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF6366F1" } },
        bottom: { style: "medium", color: { argb: "FF4F46E5" } },
        left: { style: "thin", color: { argb: "FF6366F1" } },
        right: { style: "thin", color: { argb: "FF6366F1" } },
      };
    });

    // Add Data Rows
    students.forEach((student: any, index: number) => {
      const studentCourses = studentCoursesMap.get(student.id) || [];
      const enrolledCourseNames = studentCourses.map((c) => c.title).join("، ");
      const courseCount = studentCourses.length;
      const subscriptionStatus = courseCount > 0 ? "نشط" : "غير مشترك";

      // Progress calculation
      let completedLessonsCount = 0;
      let totalAccessibleLessons = 0;
      let progressPercent = 0;

      if (needsProgress && studentCourses.length > 0) {
        const studentVp = videoProgressByStudentMap.get(student.id) || new Map<string, number>();

        studentCourses.forEach((c) => {
          const courseLessons = lessonsByCourseMap.get(c.id) || [];
          courseLessons.forEach((l) => {
            const isAccessible = c.isFullAccess || c.accessibleLessonIds.has(l.id);
            if (isAccessible) {
              totalAccessibleLessons++;
              if ((studentVp.get(l.id) || 0) > 0) {
                completedLessonsCount++;
              }
            }
          });
        });

        if (totalAccessibleLessons > 0) {
          progressPercent = Math.round((completedLessonsCount / totalAccessibleLessons) * 100);
        }
      }

      const remainingLessons = Math.max(0, totalAccessibleLessons - completedLessonsCount);

      // Quiz statistics calculation
      const attempts = quizAttemptsByStudentMap.get(student.id) || [];
      // Group best attempt per quiz
      const bestScorePerQuiz = new Map<string, { score: number; passingScore: number }>();
      attempts.forEach((att) => {
        const existing = bestScorePerQuiz.get(att.quiz_id);
        if (!existing || att.score > existing.score) {
          bestScorePerQuiz.set(att.quiz_id, {
            score: att.score,
            passingScore: att.passing_score,
          });
        }
      });

      const quizzesCount = bestScorePerQuiz.size;
      let passedQuizzes = 0;
      let failedQuizzes = 0;
      let totalScoreSum = 0;

      bestScorePerQuiz.forEach((val) => {
        totalScoreSum += val.score;
        if (val.score >= val.passingScore) {
          passedQuizzes++;
        } else {
          failedQuizzes++;
        }
      });

      const averageScore = quizzesCount > 0 ? Math.round(totalScoreSum / quizzesCount) : 0;

      // Format registration date
      const createdAtFormatted = student.created_at
        ? new Date(student.created_at).toLocaleString("ar-EG", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "غير محدد";

      const rowValues: Record<string, any> = {
        id: student.id,
        full_name: student.full_name || "بدون اسم",
        email: student.email || "غير مسجل",
        phone: student.phone || "غير مسجل",
        parent_phone: student.parent_phone || "غير مسجل",
        parent_job: student.parent_job || "غير محدد",
        school: student.school || "غير محددة",
        governorate: student.governorate || "غير محدد",
        gender: mapGenderToArabic(student.gender),
        education_system: mapEducationSystemToArabic(student.education_system, student.grade),
        track: student.track || "عام",
        grade: mapGradeToArabic(student.grade),
        created_at: createdAtFormatted,
        is_approved: student.is_approved ? "مفعل" : "معلق",
        courses: enrolledCourseNames || "لا يوجد",
        course_count: courseCount,
        subscription_status: subscriptionStatus,
        progress_percent: totalAccessibleLessons > 0 ? `${progressPercent}%` : "0%",
        completed_lessons: completedLessonsCount,
        remaining_lessons: remainingLessons,
        quizzes_count: quizzesCount,
        average_score: quizzesCount > 0 ? `${averageScore}%` : "0%",
        passed_quizzes: passedQuizzes,
        failed_quizzes: failedQuizzes,
      };

      const row = sheet.addRow(rowValues);
      row.height = 24;

      // Alternating row styling & borders
      const isEven = index % 2 === 0;
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: isEven ? "FFFFFFFF" : "FFF8FAFC" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });

    // Sheet 2: Summary Sheet
    const summarySheet = workbook.addWorksheet("ملخص التقرير", {
      views: [{ rightToLeft: true }],
      properties: { defaultRowHeight: 24 },
    });

    // Setup Summary Sheet Columns
    summarySheet.columns = [
      { header: "", key: "metric", width: 28 },
      { header: "", key: "value", width: 45 },
    ];

    // Title Row
    summarySheet.mergeCells("A1:B1");
    const titleCell = summarySheet.getCell("A1");
    titleCell.value = "تقرير بيانات الطلاب - منصة A+ Academy";
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2D2B7A" },
    };
    titleCell.font = {
      name: "Calibri",
      size: 14,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    titleCell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    summarySheet.getRow(1).height = 36;

    // Build filter descriptions
    const appliedFilterDescriptions: string[] = [];
    if (filters.grade) appliedFilterDescriptions.push(`الصف: ${mapGradeToArabic(filters.grade)}`);
    if (filters.education_system) appliedFilterDescriptions.push(`النظام: ${mapEducationSystemToArabic(filters.education_system, null)}`);
    if (filters.track) appliedFilterDescriptions.push(`المسار: ${filters.track}`);
    if (filters.governorate) appliedFilterDescriptions.push(`المحافظة: ${filters.governorate}`);
    if (filters.gender) appliedFilterDescriptions.push(`النوع: ${mapGenderToArabic(filters.gender)}`);
    if (filters.is_approved && filters.is_approved !== "all") {
      appliedFilterDescriptions.push(`حالة الحساب: ${filters.is_approved === "approved" || filters.is_approved === true ? "مفعل" : "معلق"}`);
    }
    if (filters.date_from || filters.date_to) {
      appliedFilterDescriptions.push(`تاريخ التسجيل: من ${filters.date_from || "البداية"} إلى ${filters.date_to || "الآن"}`);
    }
    const filterSummaryText = appliedFilterDescriptions.length > 0 ? appliedFilterDescriptions.join(" | ") : "الكل (بدون قيود)";

    // Summary Rows Content
    const summaryData = [
      { metric: "تاريخ وتوقيت التصدير", value: new Date().toLocaleString("ar-EG", { dateStyle: "full", timeStyle: "medium" }) },
      { metric: "تم التصدير بواسطة", value: `${adminProfile.full_name || "مسؤول النظام"} (${adminProfile.email || user.email})` },
      { metric: "نطاق التصدير", value: scope === "current" ? "الطلاب الظاهرون حالياً بالصفحة" : "كل الطلاب المطابقين للشروط" },
      { metric: "إجمالي عدد الطلاب المصدرين", value: `${students.length} طالب` },
      { metric: "إجمالي عدد الأعمدة", value: `${columnsToExport.length} عمود` },
      { metric: "الفلاتر المطبقة", value: filterSummaryText },
      { metric: "الأعمدة المضمنة في الملف", value: columnsToExport.map((c) => c.header).join("، ") },
    ];

    summaryData.forEach((row, i) => {
      const addedRow = summarySheet.addRow(row);
      addedRow.height = 26;

      const metricCell = addedRow.getCell("metric");
      metricCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF2D2B7A" } };
      metricCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      metricCell.alignment = { vertical: "middle", horizontal: "right" };
      metricCell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      const valueCell = addedRow.getCell("value");
      valueCell.font = { name: "Calibri", size: 10, color: { argb: "FF334155" } };
      valueCell.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
      valueCell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });

    // 8. Generate Buffer and Return Excel File
    const buffer = await workbook.xlsx.writeBuffer();

    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `students_export_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Critical error in student Excel export route:", error);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع أثناء إعداد ملف Excel: " + (error?.message || "خطأ مجهول") },
      { status: 500 }
    );
  }
}

// Helper to return an empty structured excel file when no students match
async function generateEmptyWorkbookResponse(adminProfile: any, columnsToExport: ExportColumnDef[], filters: any) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("بيانات الطلاب", {
    views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
  });

  sheet.columns = columnsToExport.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF7D79F1" },
    };
    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const emptyRow = sheet.addRow({ full_name: "لا توجد بيانات مطابقة لخيارات الفلترة المحددة" });
  emptyRow.height = 26;

  const buffer = await workbook.xlsx.writeBuffer();
  const timestamp = new Date().toISOString().split("T")[0];

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="students_export_empty_${timestamp}.xlsx"`,
    },
  });
}
