"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStudents, approveStudent, rejectStudent, resetStudentVideoProgress, getCourses } from "@/lib/admin";
import { 
  grantCourseAccess, 
  revokeCourseAccess, 
  transferCourseAccess, 
  getLessonsForCourse, 
  grantMultipleLessonsAccess, 
  grantLessonAccess, 
  revokeLessonAccess 
} from "@/lib/course-access";
import { Search, Check, Trash2, Phone, User, GraduationCap, MapPin, Eye, School, Mail, ShieldCheck, Plus, ArrowRightLeft, X, Loader2, Lock, Unlock, PlayCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

function mapGradeToArabic(grade: string) {
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
      return grade || "غير محدد";
  }
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Student Course & Lesson Actions State
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [selectedNewCourseId, setSelectedNewCourseId] = useState("");
  const [accessScope, setAccessScope] = useState<"full" | "lessons">("full");
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [addingCourse, setAddingCourse] = useState(false);
  
  const [transferringCourseId, setTransferringCourseId] = useState<string | null>(null);
  const [selectedTransferTargetId, setSelectedTransferTargetId] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  const [studentPerformance, setStudentPerformance] = useState<any[]>([]);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  const supabase = createClient();

  async function loadStudentPerformanceData(studentId: string) {
    try {
      setLoadingPerformance(true);
      setStudentPerformance([]);
      
      // 1. Fetch Subscriptions, Course Access, and Lesson Access
      const [
        { data: subs, error: subsError }, 
        { data: directAccessList }, 
        { data: lessonAccessList }
      ] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("*, courses(*)")
          .eq("user_id", studentId)
          .eq("status", "approved"),
        supabase
          .from("course_access")
          .select("*, courses(*)")
          .eq("student_id", studentId),
        supabase
          .from("lesson_access")
          .select("*, courses(*), lessons(*)")
          .eq("user_id", studentId)
      ]);

      if (subsError) throw subsError;

      const activeCourseAccessMap = new Map<string, boolean>();
      const revokedCourseAccessMap = new Map<string, boolean>();
      (directAccessList || []).forEach((ca: any) => {
        if (ca.status === "active") activeCourseAccessMap.set(ca.course_id, true);
        if (ca.status === "revoked") revokedCourseAccessMap.set(ca.course_id, true);
      });

      // Map of courseId -> { course, isFullAccess: boolean, accessibleLessonIds: Set<string> }
      const coursesMap = new Map<string, any>();

      // A. Add direct course_access
      (directAccessList || []).forEach((item: any) => {
        if (item.status === "active" && item.courses) {
          if (!coursesMap.has(item.courses.id)) {
            coursesMap.set(item.courses.id, {
              course: item.courses,
              isFullAccess: true,
              accessibleLessonIds: new Set<string>(),
            });
          } else {
            coursesMap.get(item.courses.id)!.isFullAccess = true;
          }
        }
      });

      // B. Add subscriptions
      (subs || []).forEach((sub: any) => {
        if (!sub.courses) return;
        const cid = sub.courses.id;
        const isRevoked = revokedCourseAccessMap.has(cid);
        if (isRevoked) return;

        if (!coursesMap.has(cid)) {
          coursesMap.set(cid, {
            course: sub.courses,
            isFullAccess: !sub.lesson_id,
            accessibleLessonIds: new Set<string>(),
          });
        }
        if (!sub.lesson_id) {
          coursesMap.get(cid)!.isFullAccess = true;
        } else {
          coursesMap.get(cid)!.accessibleLessonIds.add(sub.lesson_id);
        }
      });

      // C. Add lesson_access
      (lessonAccessList || []).forEach((la: any) => {
        if (!la.courses) return;
        const cid = la.courses.id;
        if (!coursesMap.has(cid)) {
          coursesMap.set(cid, {
            course: la.courses,
            isFullAccess: activeCourseAccessMap.has(cid),
            accessibleLessonIds: new Set<string>(),
          });
        }
        coursesMap.get(cid)!.accessibleLessonIds.add(la.lesson_id);
      });

      const uniqueCourses = Array.from(coursesMap.values());

      // 2. Fetch Attempts
      const { data: attempts, error: attError } = await supabase
        .from("student_quiz_attempts")
        .select("*, quizzes(*)")
        .eq("user_id", studentId)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false });

      if (attError) throw attError;

      // Group attempts by quiz
      const quizAttemptsMap = new Map<string, any[]>();
      (attempts || []).forEach((att: any) => {
        if (!quizAttemptsMap.has(att.quiz_id)) {
          quizAttemptsMap.set(att.quiz_id, []);
        }
        quizAttemptsMap.get(att.quiz_id)!.push(att);
      });

      // 3. For each course, fetch its quizzes, lessons, video progress and calculate progress
      const perfDetails = await Promise.all(uniqueCourses.map(async (cEntry: any) => {
        const course = cEntry.course;
        if (!course) return null;

        // Fetch all lessons of this course
        const { data: rawLessons } = await supabase
          .from("lessons")
          .select("*")
          .eq("course_id", course.id)
          .order("order", { ascending: true });

        const allLessons = rawLessons || [];

        // Determine accessible lessons
        const isFull = cEntry.isFullAccess;
        const accessibleLessonSet: Set<string> = isFull
          ? new Set(allLessons.map((l: any) => l.id))
          : cEntry.accessibleLessonIds;

        // Fetch quizzes of this course
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("*")
          .eq("course_id", course.id)
          .eq("is_active", true);

        const quizStats = (quizzes || []).map((q: any) => {
          const quizAtts = quizAttemptsMap.get(q.id) || [];
          const attemptsCount = quizAtts.length;
          const highestScore = attemptsCount > 0 
            ? Math.max(...quizAtts.map((a: any) => Number(a.score)))
            : null;
          
          return {
            id: q.id,
            title: q.title,
            type: q.type,
            lesson_id: q.lesson_id,
            isUnlocked: isFull || (q.lesson_id ? accessibleLessonSet.has(q.lesson_id) : isFull),
            attemptsCount,
            highestScore,
            passed: highestScore !== null ? highestScore >= q.passing_score : false
          };
        });

        // Fetch Video Progress
        let lessonStats: any[] = [];
        let videoProgressPercent = 100;

        if (allLessons.length > 0) {
          const lessonIds = allLessons.map((l: any) => l.id);
          const { data: vpData } = await supabase
            .from("video_progress")
            .select("*")
            .eq("user_id", studentId)
            .in("lesson_id", lessonIds);

          const vpMap = new Map<string, number>(
            (vpData || []).map((vp: any) => [vp.lesson_id, vp.views_count || 0])
          );

          let completedLessons = 0;
          let totalAccessible = 0;

          lessonStats = allLessons.map((l: any) => {
            const isAccessible = isFull || accessibleLessonSet.has(l.id);
            const viewsCount = vpMap.get(l.id) || 0;
            if (isAccessible) {
              totalAccessible++;
              if (viewsCount > 0) completedLessons++;
            }
            return {
              id: l.id,
              title: l.title,
              order: l.order,
              viewsCount,
              isAccessible,
            };
          });

          if (totalAccessible > 0) {
            videoProgressPercent = Math.round((completedLessons / totalAccessible) * 100);
          }
        }

        // Calculate progress
        const completedLessonQuizzes = quizStats.filter((q: any) => q.type === "quiz" && q.passed && q.isUnlocked).length;
        const totalLessonQuizzes = quizStats.filter((q: any) => q.type === "quiz" && q.isUnlocked).length;
        
        let progress = 100;
        if (totalLessonQuizzes > 0) {
          progress = Math.round((completedLessonQuizzes / totalLessonQuizzes) * 100);
        } else if (allLessons.length > 0) {
          progress = videoProgressPercent;
        }

        return {
          courseId: course.id,
          courseTitle: course.title,
          isFullAccess: isFull,
          accessibleCount: isFull ? allLessons.length : accessibleLessonSet.size,
          totalLessonsCount: allLessons.length,
          progress,
          quizStats,
          lessonStats,
          videoProgressPercent
        };
      }));

      setStudentPerformance(perfDetails.filter(Boolean));
    } catch (error) {
      console.error("فشل جلب تفاصيل أداء الطالب:", error);
    } finally {
      setLoadingPerformance(false);
    }
  }

  useEffect(() => {
    if (selectedStudent) {
      loadStudentPerformanceData(selectedStudent.id);
    }
  }, [selectedStudent]);

  async function loadCoursesList() {
    try {
      const data = await getCourses();
      setAllCourses(data || []);
    } catch (e) {
      console.error("Error loading courses:", e);
    }
  }

  async function loadStudents() {
    try {
      setLoading(true);
      const data = await getStudents();
      setStudents(data);
      setFilteredStudents(data);
    } catch (error) {
      console.error("فشل تحميل الطلاب:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
    loadCoursesList();
  }, []);

  async function handleCourseSelectForAdd(courseId: string) {
    setSelectedNewCourseId(courseId);
    setSelectedLessonIds([]);
    if (!courseId) {
      setCourseLessons([]);
      return;
    }
    try {
      setLoadingLessons(true);
      const lessons = await getLessonsForCourse(courseId);
      setCourseLessons(lessons || []);
    } catch (e) {
      console.error("Error loading lessons for course:", e);
    } finally {
      setLoadingLessons(false);
    }
  }

  async function handleAddAccessToStudent() {
    if (!selectedStudent) return;
    if (!selectedNewCourseId) {
      alert("يرجى اختيار الكورس أولاً.");
      return;
    }

    if (accessScope === "lessons" && selectedLessonIds.length === 0) {
      alert("يرجى تحديد حصة واحدة على الأقل لمنح الطالب صلاحية الوصول إليها.");
      return;
    }

    try {
      setAddingCourse(true);
      if (accessScope === "full") {
        await grantCourseAccess(selectedStudent.id, selectedNewCourseId, "manual");
        alert("✅ تم تفعيل الكورس بالكامل للطالب بنجاح!");
      } else {
        await grantMultipleLessonsAccess(selectedStudent.id, selectedNewCourseId, selectedLessonIds);
        alert(`✅ تم تفعيل (${selectedLessonIds.length}) حصة للطالب بنجاح!`);
      }

      setShowAddCourse(false);
      setSelectedNewCourseId("");
      setSelectedLessonIds([]);
      setCourseLessons([]);
      setAccessScope("full");
      loadStudentPerformanceData(selectedStudent.id);
    } catch (err: any) {
      alert("❌ فشل تفعيل الصلاحية: " + err.message);
    } finally {
      setAddingCourse(false);
    }
  }

  async function handleRevokeSingleLesson(lessonId: string, lessonTitle: string) {
    if (!selectedStudent) return;
    if (!confirm(`هل أنت متأكد من إلغاء صلاحية الطالب "${selectedStudent.full_name}" في حصة "${lessonTitle}"؟`)) {
      return;
    }

    try {
      await revokeLessonAccess(selectedStudent.id, lessonId);
      alert("✅ تم إلغاء صلاحية الحصة بنجاح.");
      loadStudentPerformanceData(selectedStudent.id);
    } catch (err: any) {
      alert("❌ فشل إلغاء صلاحية الحصة: " + err.message);
    }
  }

  async function handleGrantSingleLesson(courseId: string, lessonId: string) {
    if (!selectedStudent) return;

    try {
      await grantLessonAccess(selectedStudent.id, courseId, lessonId);
      alert("✅ تم تفعيل الحصة للطالب بنجاح!");
      loadStudentPerformanceData(selectedStudent.id);
    } catch (err: any) {
      alert("❌ فشل تفعيل الحصة: " + err.message);
    }
  }

  async function handleCancelCourseSubscription(courseId: string, courseTitle: string) {
    if (!selectedStudent) return;
    if (!confirm(`هل أنت متأكد من إلغاء وصول الطالب "${selectedStudent.full_name}" لكورس "${courseTitle}" بالكامل؟ سيفقد الطالب إمكانية فتح المحاضرات والامتحانات فوراً مع الحفاظ على درجاته ومحاولاته.`)) {
      return;
    }

    try {
      await revokeCourseAccess(selectedStudent.id, courseId);
      alert("✅ تم إلغاء اشتراك/صلاحية الطالب من هذا الكورس بنجاح.");
      loadStudentPerformanceData(selectedStudent.id);
    } catch (err: any) {
      alert("❌ فشل إلغاء الاشتراك: " + err.message);
    }
  }

  async function handleTransferCourse(fromCourseId: string) {
    if (!selectedStudent) return;
    if (!selectedTransferTargetId) {
      alert("يرجى اختيار الكورس الجديد المراد التحويل إليه.");
      return;
    }

    try {
      setTransferSubmitting(true);
      await transferCourseAccess(selectedStudent.id, fromCourseId, selectedTransferTargetId);
      alert("✅ تم تحويل اشتراك الطالب للكورس الجديد بنجاح!");
      setTransferringCourseId(null);
      setSelectedTransferTargetId("");
      loadStudentPerformanceData(selectedStudent.id);
    } catch (err: any) {
      alert("❌ فشل نقل الكورس: " + err.message);
    } finally {
      setTransferSubmitting(false);
    }
  }

  // Filter students based on search and filters
  useEffect(() => {
    let result = students;

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(term) ||
          s.phone?.includes(term) ||
          s.email?.toLowerCase().includes(term)
      );
    }

    if (gradeFilter !== "") {
      result = result.filter((s) => s.grade === gradeFilter);
    }

    if (approvalFilter !== "all") {
      const isApproved = approvalFilter === "approved";
      result = result.filter((s) => s.is_approved === isApproved);
    }

    setFilteredStudents(result);
  }, [searchTerm, gradeFilter, approvalFilter, students]);

  async function handleApprove(id: string) {
    if (!confirm("هل أنت متأكد من رغبتك في تفعيل حساب هذا الطالب؟")) return;
    try {
      await approveStudent(id);
      alert("تم تفعيل حساب الطالب بنجاح.");
      loadStudents();
      if (selectedStudent?.id === id) {
        setSelectedStudent((prev: any) => ({ ...prev, is_approved: true }));
      }
    } catch (error: any) {
      alert("فشل التفعيل: " + error.message);
    }
  }

  async function handleReject(id: string) {
    if (!confirm("هل أنت متأكد من حذف/رفض هذا الطالب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    try {
      await rejectStudent(id);
      alert("تم حذف حساب الطالب بنجاح.");
      loadStudents();
      if (selectedStudent?.id === id) {
        setSelectedStudent(null);
      }
    } catch (error: any) {
      alert("فشل الحذف: " + error.message);
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2D2B7A]">👨‍🎓 إدارة الطلاب</h1>
          <p className="text-gray-500 mt-2">عرض وتفعيل وحذف حسابات الطلاب المسجلين في المنصة</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="ابحث بالاسم، الهاتف، أو البريد الإلكتروني..."
            className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-3 top-3.5 text-gray-400" size={18} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Grade filter */}
          <select
            className="px-4 py-3 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-semibold bg-white cursor-pointer focus:border-[#7D79F1]"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option value="">كل الصفوف الدراسية</option>
            <option value="first">الصف الأول الثانوي</option>
            <option value="second">الصف الثاني الثانوي</option>
            <option value="third">الصف الثالث الثانوي</option>
            <option value="prep3">الصف الثالث الإعدادي</option>
          </select>

          {/* Status filter */}
          <select
            className="px-4 py-3 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-semibold bg-white cursor-pointer focus:border-[#7D79F1]"
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
          >
            <option value="all">كل الحسابات</option>
            <option value="pending">في انتظار التفعيل</option>
            <option value="approved">الحسابات المفعلة</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Students Table/List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 font-bold">جاري تحميل بيانات الطلاب...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-bold">لا يوجد طلاب يطابقون خيارات البحث.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-[#F5F7FB] border-b text-[#2D2B7A] font-bold">
                  <tr>
                    <th className="p-4">الاسم</th>
                    <th className="p-4">الهاتف</th>
                    <th className="p-4">الصف الدراسية</th>
                    <th className="p-4 text-center">الحالة</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-[#F3F2FF]/30 transition">
                      <td className="p-4 font-bold text-[#2D2B7A]">
                        <div>
                          {student.full_name}
                          <span className="block text-xs text-gray-400 font-normal">{student.email}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-semibold">{student.phone}</td>
                      <td className="p-4 text-sm">{mapGradeToArabic(student.grade)}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                            student.is_approved
                              ? "bg-green-50 text-green-600 border border-green-200"
                              : "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}
                        >
                          {student.is_approved ? "مفعل" : "معلق"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            title="عرض كامل التفاصيل"
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {!student.is_approved && (
                            <button
                              onClick={() => handleApprove(student.id)}
                              title="تفعيل الحساب"
                              className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                            >
                              <Check size={16} />
                            </button>
                          )}

                          <button
                            onClick={() => handleReject(student.id)}
                            title="حذف الطالب"
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Student Details Sidebar */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit">
          <h2 className="text-xl font-extrabold text-[#2D2B7A] border-b pb-4 mb-4">🔍 تفاصيل الطالب</h2>
          
          {selectedStudent ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#7D79F1] mb-1">{selectedStudent.full_name}</h3>
                <span className="text-sm text-gray-400">{selectedStudent.email || "بدون بريد إلكتروني"}</span>
              </div>

              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  <GraduationCap className="text-gray-400" size={18} />
                  <span><strong>الصف:</strong> {mapGradeToArabic(selectedStudent.grade)}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="text-gray-400" size={18} />
                  <span><strong>النظام:</strong> {(() => {
                    const sys = selectedStudent.education_system;
                    if (sys === "general") return "عام";
                    if (sys === "azhar") return "أزهر";
                    if (sys === "general_baccalaureate") return "عام (بكالوريا)";
                    if (sys === "azhar_baccalaureate") return "أزهر (بكالوريا)";
                    return sys || "غير محدد";
                  })()}{selectedStudent.grade !== "prep3" && ` - ${selectedStudent.track}`}</span>
                </div>

                <div className="flex items-center gap-3">
                  <School className="text-gray-400" size={18} />
                  <span><strong>المدرسة:</strong> {selectedStudent.school || "غير محددة"}</span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="text-gray-400" size={18} />
                  <span><strong>المحافظة:</strong> {selectedStudent.governorate}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-gray-400" size={18} />
                  <span><strong>الهاتف:</strong> {selectedStudent.phone}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="text-gray-400" size={18} />
                  <span><strong>البريد الإلكتروني:</strong> {selectedStudent.email || "بدون بريد إلكتروني"}</span>
                </div>

                <div className="border-t pt-3 mt-3">
                  <p className="text-gray-400 text-xs mb-2">بيانات ولي الأمر</p>
                  <p className="mb-1"><strong>رقم ولي الأمر:</strong> {selectedStudent.parent_phone}</p>
                  <p><strong>وظيفة ولي الأمر:</strong> {selectedStudent.parent_job || "غير محددة"}</p>
                </div>

                <div className="border-t pt-4 mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-[#2D2B7A] text-sm">📖 الكورسات والحصص المتاحة للطالب</h4>
                    <button
                      onClick={() => setShowAddCourse(prev => !prev)}
                      className="px-3 py-1.5 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus size={14} />
                      إضافة كورس أو حصة
                    </button>
                  </div>

                  {/* Add Course/Lesson Inline Selector */}
                  {showAddCourse && (
                    <div className="p-3.5 bg-[#F3F2FF] border border-[#7D79F1]/30 rounded-2xl space-y-3 animate-in fade-in duration-150">
                      <p className="text-xs font-bold text-[#2D2B7A]">اختر الكورس لتفعيل الصلاحية للطالب:</p>
                      <select
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-[#2D2B7A] outline-none focus:border-[#7D79F1] cursor-pointer"
                        value={selectedNewCourseId}
                        onChange={(e) => handleCourseSelectForAdd(e.target.value)}
                      >
                        <option value="">-- اختر الكورس --</option>
                        {allCourses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} {c.teachers?.name ? `(${c.teachers.name})` : ""}
                          </option>
                        ))}
                      </select>

                      {selectedNewCourseId && (
                        <div className="space-y-2.5 pt-1">
                          <p className="text-xs font-bold text-[#2D2B7A]">نطاق الصلاحية:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setAccessScope("full")}
                              className={`p-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                                accessScope === "full"
                                  ? "bg-[#7D79F1] text-white border-[#7D79F1] shadow-xs"
                                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              🟢 الكورس بالكامل
                            </button>
                            <button
                              type="button"
                              onClick={() => setAccessScope("lessons")}
                              className={`p-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                                accessScope === "lessons"
                                  ? "bg-[#7D79F1] text-white border-[#7D79F1] shadow-xs"
                                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              🟣 حصص محددة فقط
                            </button>
                          </div>

                          {accessScope === "lessons" && (
                            <div className="space-y-2 bg-white p-3 rounded-xl border border-gray-200">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-700">اختر الحصص المتاحة:</span>
                                <div className="flex gap-2 text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedLessonIds(courseLessons.map((l: any) => l.id))}
                                    className="text-[#7D79F1] font-bold hover:underline cursor-pointer"
                                  >
                                    تحديد الكل
                                  </button>
                                  <span className="text-gray-300">•</span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedLessonIds([])}
                                    className="text-gray-500 font-bold hover:underline cursor-pointer"
                                  >
                                    إلغاء التحديد
                                  </button>
                                </div>
                              </div>

                              {loadingLessons ? (
                                <div className="text-center py-4 text-xs text-gray-400 flex items-center justify-center gap-1.5">
                                  <Loader2 size={13} className="animate-spin text-[#7D79F1]" />
                                  جاري تحميل حصص الكورس...
                                </div>
                              ) : courseLessons.length === 0 ? (
                                <p className="text-xs text-amber-600 text-center py-2">لا توجد حصص مضافة في هذا الكورس بعد.</p>
                              ) : (
                                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 divide-y divide-gray-100">
                                  {courseLessons.map((l: any, idx: number) => {
                                    const isChecked = selectedLessonIds.includes(l.id);
                                    return (
                                      <label
                                        key={l.id}
                                        className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer transition ${
                                          isChecked ? "bg-purple-50 text-[#2D2B7A] font-bold" : "hover:bg-gray-50 text-gray-600"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedLessonIds((prev) => [...prev, l.id]);
                                            } else {
                                              setSelectedLessonIds((prev) => prev.filter((id) => id !== l.id));
                                            }
                                          }}
                                          className="rounded text-[#7D79F1] focus:ring-[#7D79F1]"
                                        />
                                        <span className="text-[10px] text-gray-400 font-mono">#{idx + 1}</span>
                                        <span className="flex-1 line-clamp-1">{l.title}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleAddAccessToStudent}
                          disabled={addingCourse || !selectedNewCourseId || (accessScope === "lessons" && selectedLessonIds.length === 0)}
                          className="flex-1 py-2.5 bg-[#7D79F1] hover:bg-[#655EF0] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {addingCourse ? <Loader2 size={13} className="animate-spin" /> : "تفعيل الصلاحية للطالب ✅"}
                        </button>
                        <button
                          onClick={() => {
                            setShowAddCourse(false);
                            setSelectedNewCourseId("");
                            setSelectedLessonIds([]);
                            setCourseLessons([]);
                            setAccessScope("full");
                          }}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  {loadingPerformance ? (
                    <div className="text-center py-6 text-xs text-gray-400 flex items-center justify-center gap-2">
                      <Loader2 size={15} className="animate-spin text-[#7D79F1]" />
                      جاري تحميل بيانات الكورسات والحصص...
                    </div>
                  ) : studentPerformance.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-250 p-4 space-y-1.5">
                      <p className="text-xs text-gray-600 font-bold">الطالب غير مشترك في أي كورس أو حصة حالياً.</p>
                      <p className="text-[11px] text-gray-400">يمكنك الضغط على زر "إضافة كورس أو حصة" بالأعلى لتفعيل الصلاحية له مباشرة.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studentPerformance.map((courseItem: any) => {
                        const isTransferringThis = transferringCourseId === courseItem.courseId;

                        return (
                          <div key={courseItem.courseId} className="bg-gray-50 p-3.5 rounded-2xl border text-xs space-y-2.5">
                            
                            {/* Course Title and Access Badge */}
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-bold text-[#2D2B7A] text-xs line-clamp-1">{courseItem.courseTitle}</span>
                                <div className="mt-1">
                                  {courseItem.isFullAccess ? (
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                      🟢 كورس كامل (شامل)
                                    </span>
                                  ) : (
                                    <span className="bg-purple-100 text-[#7D79F1] px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                      🟣 حصص محددة ({courseItem.accessibleCount} من {courseItem.totalLessonsCount})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="bg-purple-50 text-[#7D79F1] border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                                {courseItem.progress}%
                              </span>
                            </div>

                            {/* Direct Action Buttons: Transfer & Cancel Subscription */}
                            <div className="flex items-center gap-2 pt-1 border-t border-gray-200/60">
                              {courseItem.isFullAccess ? (
                                <button
                                  onClick={() => {
                                    setTransferringCourseId(isTransferringThis ? null : courseItem.courseId);
                                    setSelectedTransferTargetId("");
                                  }}
                                  className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <ArrowRightLeft size={12} />
                                  تبديل بكورس آخر
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setShowAddCourse(true);
                                    handleCourseSelectForAdd(courseItem.courseId);
                                    setAccessScope("lessons");
                                  }}
                                  className="flex-1 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-[#7D79F1] font-bold rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Plus size={12} />
                                  إضافة حصص أخرى
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleCancelCourseSubscription(courseItem.courseId, courseItem.courseTitle)}
                                className="flex-1 py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={12} />
                                إلغاء الكورس
                              </button>
                            </div>

                            {/* Inline Transfer Form */}
                            {isTransferringThis && (
                              <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                                <p className="text-[10px] font-bold text-blue-900">اختر الكورس البديل للتحويل إليه فوراً:</p>
                                <select
                                  className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-[#2D2B7A] outline-none cursor-pointer"
                                  value={selectedTransferTargetId}
                                  onChange={(e) => setSelectedTransferTargetId(e.target.value)}
                                >
                                  <option value="">-- اختر الكورس الجديد --</option>
                                  {allCourses
                                    .filter((c) => c.id !== courseItem.courseId)
                                    .map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.title}
                                      </option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleTransferCourse(courseItem.courseId)}
                                    disabled={transferSubmitting || !selectedTransferTargetId}
                                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    {transferSubmitting ? <Loader2 size={11} className="animate-spin" /> : "تأكيد التبديل 🔄"}
                                  </button>
                                  <button
                                    onClick={() => setTransferringCourseId(null)}
                                    className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-[10px] cursor-pointer"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Progress bar */}
                            <div className="w-full bg-gray-250 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[#7D79F1] h-full rounded-full" style={{ width: `${courseItem.progress}%` }} />
                            </div>

                            {/* Lectures Access & Views Progress */}
                            {courseItem.lessonStats?.length > 0 && (
                              <div className="pt-2 border-t border-gray-200/50 space-y-1.5">
                                <p className="text-[10px] text-gray-500 font-bold flex items-center justify-between">
                                  <span>🎥 المحاضرات وحالة الوصول:</span>
                                  <span className="text-[9px] text-gray-400 font-normal">
                                    {courseItem.isFullAccess ? "الكورس مفتوح بالكامل" : `${courseItem.accessibleCount} حصص مفعلة`}
                                  </span>
                                </p>
                                {courseItem.lessonStats.map((ls: any) => (
                                  <div key={ls.id} className={`flex justify-between items-center text-[10px] p-2 rounded-xl border transition gap-2 ${
                                    ls.isAccessible ? "bg-white text-gray-700 border-gray-200" : "bg-gray-100/70 text-gray-400 border-dashed border-gray-200"
                                  }`}>
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      {ls.isAccessible ? (
                                        <Unlock size={12} className="text-green-600 shrink-0" />
                                      ) : (
                                        <Lock size={12} className="text-gray-400 shrink-0" />
                                      )}
                                      <span className="font-semibold line-clamp-1">{ls.title}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {ls.isAccessible ? (
                                        <>
                                          <span className={`font-bold text-[9px] ${ls.viewsCount > 0 ? "text-[#7D79F1]" : "text-gray-400"}`}>
                                            {ls.viewsCount > 0 ? `شوهد ${ls.viewsCount}/4` : "لم يُشاهد"}
                                          </span>
                                          {ls.viewsCount > 0 && (
                                            <button
                                              onClick={async () => {
                                                if (confirm(`هل أنت متأكد من تصفير وإعادة تعيين مشاهدات الطالب لهذا الدرس؟`)) {
                                                  try {
                                                    await resetStudentVideoProgress(selectedStudent.id, ls.id);
                                                    alert("تم تصفير عدد المشاهدات بنجاح.");
                                                    loadStudentPerformanceData(selectedStudent.id);
                                                  } catch (err: any) {
                                                    alert("فشل إعادة التعيين: " + err.message);
                                                  }
                                                }
                                              }}
                                              className="text-amber-600 hover:text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 hover:bg-amber-100 transition cursor-pointer text-[9px]"
                                              title="تصفير المشاهدات"
                                            >
                                              تصفير 🔄
                                            </button>
                                          )}
                                          {!courseItem.isFullAccess && (
                                            <button
                                              onClick={() => handleRevokeSingleLesson(ls.id, ls.title)}
                                              className="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded border border-red-200 bg-red-50 hover:bg-red-100 transition cursor-pointer text-[9px]"
                                              title="إلغاء صلاحية هذه الحصة فقط"
                                            >
                                              إلغاء ❌
                                            </button>
                                          )}
                                        </>
                                      ) : (
                                        <button
                                          onClick={() => handleGrantSingleLesson(courseItem.courseId, ls.id)}
                                          className="text-emerald-700 hover:text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer text-[9px] flex items-center gap-1"
                                          title="تفعيل هذه الحصة للطالب الآن"
                                        >
                                          تفعيل الحصة 🔓
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Quiz stats list */}
                            {courseItem.quizStats?.length > 0 && (
                              <div className="pt-2 border-t border-gray-200/50 space-y-1.5">
                                <p className="text-[10px] text-gray-400 font-bold">📝 أداء الامتحانات والواجبات:</p>
                                {courseItem.quizStats.map((qs: any) => (
                                  <div key={qs.id} className="flex justify-between text-[11px] text-gray-500">
                                    <span>{qs.type === "final" ? "🏆 الامتحان النهائي" : `📝 ${qs.title}`}</span>
                                    <span className={qs.highestScore !== null ? (qs.passed ? "text-green-600 font-bold" : "text-red-500") : "text-gray-400"}>
                                      {qs.highestScore !== null ? `${qs.highestScore}% (محاولات: ${qs.attemptsCount})` : "لم يحل بعد"}
                                    </span>
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

                <div className="flex gap-3 border-t pt-4 mt-4">
                  {!selectedStudent.is_approved && (
                    <button
                      onClick={() => handleApprove(selectedStudent.id)}
                      className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition text-xs"
                    >
                      تفعيل الحساب
                    </button>
                  )}
                  <button
                    onClick={() => handleReject(selectedStudent.id)}
                    className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition text-xs"
                  >
                    حذف الطالب
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">
              اختر طالباً من القائمة لعرض تفاصيله الكاملة هنا.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}