"use client";

import { useEffect, useState } from "react";
import { getStudents, approveStudent, rejectStudent } from "@/lib/admin";
import { Search, Check, Trash2, Phone, User, GraduationCap, MapPin, Eye } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const [studentPerformance, setStudentPerformance] = useState<any[]>([]);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  const supabase = createClient();

  async function loadStudentPerformanceData(studentId: string) {
    try {
      setLoadingPerformance(true);
      setStudentPerformance([]);
      
      // 1. Fetch Subscriptions
      const { data: subs, error: subsError } = await supabase
        .from("subscriptions")
        .select("*, courses(*)")
        .eq("user_id", studentId)
        .eq("status", "approved");

      if (subsError) throw subsError;

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
      const perfDetails = await Promise.all((subs || []).map(async (sub: any) => {
        const course = sub.courses;
        if (!course) return null;

        // Fetch quizzes of this course
        const { data: quizzes, error: qError } = await supabase
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
            attemptsCount,
            highestScore,
            passed: highestScore !== null ? highestScore >= q.passing_score : false
          };
        });

        // Fetch Lessons & Video Progress
        const { data: lessons } = await supabase
          .from("lessons")
          .select("*")
          .eq("course_id", course.id)
          .order("order", { ascending: true });

        let lessonStats: any[] = [];
        let videoProgressPercent = 100;

        if (lessons && lessons.length > 0) {
          const lessonIds = lessons.map((l: any) => l.id);
          const { data: vpData } = await supabase
            .from("video_progress")
            .select("*")
            .eq("user_id", studentId)
            .in("lesson_id", lessonIds);

          const vpMap = new Map<string, number>(
            (vpData || []).map((vp: any) => [vp.lesson_id, vp.views_count || 0])
          );

          let completedLessons = 0;
          lessonStats = lessons.map((l: any) => {
            const viewsCount = vpMap.get(l.id) || 0;
            if (viewsCount > 0) completedLessons++;
            return {
              id: l.id,
              title: l.title,
              viewsCount
            };
          });

          videoProgressPercent = Math.round((completedLessons / lessons.length) * 100);
        }

        // Calculate progress
        const completedLessonQuizzes = quizStats.filter((q: any) => q.type === "quiz" && q.passed).length;
        const totalLessonQuizzes = quizStats.filter((q: any) => q.type === "quiz").length;
        
        let progress = 100;
        if (totalLessonQuizzes > 0) {
          progress = Math.round((completedLessonQuizzes / totalLessonQuizzes) * 100);
        } else if (lessons && lessons.length > 0) {
          progress = videoProgressPercent;
        }

        return {
          courseId: course.id,
          courseTitle: course.title,
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

  const supabaseAdmin = createClient(); // Keep local client configuration compatible

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
  }, []);

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
                  <span><strong>النظام:</strong> {selectedStudent.education_system === "general" ? "عام" : "أزهر"}{selectedStudent.grade !== "prep3" && ` - ${selectedStudent.track}`}</span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="text-gray-400" size={18} />
                  <span><strong>المحافظة:</strong> {selectedStudent.governorate}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-gray-400" size={18} />
                  <span><strong>الهاتف:</strong> {selectedStudent.phone}</span>
                </div>

                <div className="border-t pt-3 mt-3">
                  <p className="text-gray-400 text-xs mb-2">بيانات ولي الأمر</p>
                  <p className="mb-1"><strong>رقم ولي الأمر:</strong> {selectedStudent.parent_phone}</p>
                  <p><strong>وظيفة ولي الأمر:</strong> {selectedStudent.parent_job || "غير محددة"}</p>
                </div>

                <div className="border-t pt-4 mt-4 space-y-4">
                  <h4 className="font-extrabold text-[#2D2B7A] text-sm">📖 الكورسات ومتابعة الأداء</h4>

                  {loadingPerformance ? (
                    <div className="text-center py-4 text-xs text-gray-400">جاري تحميل تقارير التقدم...</div>
                  ) : studentPerformance.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center">الطالب غير مشترك في أي كورس بعد.</p>
                  ) : (
                    <div className="space-y-3">
                      {studentPerformance.map((courseItem: any) => (
                        <div key={courseItem.courseId} className="bg-gray-50 p-3.5 rounded-2xl border text-xs space-y-2">
                          <div className="flex justify-between items-center font-bold text-[#2D2B7A]">
                            <span className="line-clamp-1">{courseItem.courseTitle}</span>
                            <span className="bg-purple-100 text-[#7D79F1] px-2 py-0.5 rounded text-[10px]">{courseItem.progress}%</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full bg-gray-250 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#7D79F1] h-full rounded-full" style={{ width: `${courseItem.progress}%` }} />
                          </div>

                          {/* Lectures Progress */}
                          {courseItem.lessonStats?.length > 0 && (
                            <div className="pt-2 border-t border-gray-200/50 space-y-1.5">
                              <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">🎥 تقدم مشاهدة المحاضرات:</p>
                              {courseItem.lessonStats.map((ls: any) => (
                                <div key={ls.id} className="flex justify-between items-center text-[10px] text-gray-600 bg-white/70 p-1.5 rounded border border-gray-150">
                                  <span className="font-semibold line-clamp-1 flex-1 text-right">{ls.title}</span>
                                  <span className={`font-bold mr-2 text-left ${ls.viewsCount > 0 ? "text-[#7D79F1]" : "text-gray-400"}`}>
                                    {ls.viewsCount > 0 ? `شوهد: ${ls.viewsCount} / 4 مرات` : "لم يُشاهد بعد"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quiz stats list */}
                          {courseItem.quizStats?.length > 0 ? (
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
                          ) : (
                            (!courseItem.lessonStats || courseItem.lessonStats.length === 0) && (
                              <p className="text-[10px] text-gray-400">لا توجد محاضرات أو امتحانات مضافة لهذا الكورس بعد 📂</p>
                            )
                          )}
                        </div>
                      ))}
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