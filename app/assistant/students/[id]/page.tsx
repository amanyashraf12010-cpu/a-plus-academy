"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  getAssistantStudentDetails, 
  getAssistantStudentCourseProgress, 
  StudentCourseProgressData 
} from "@/lib/assistant";
import { 
  ArrowRight, 
  User, 
  Phone, 
  BookOpen, 
  Video, 
  FileText, 
  FileQuestion, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  GraduationCap,
  Eye,
  Award
} from "lucide-react";

function StudentDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [progressData, setProgressData] = useState<StudentCourseProgressData | null>(null);

  const [loadingStudent, setLoadingStudent] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Load student details & enrolled courses for this teacher
  useEffect(() => {
    async function loadStudent() {
      if (!studentId) return;
      try {
        setLoadingStudent(true);
        setErrorMsg("");
        const data = await getAssistantStudentDetails(studentId);
        setStudent(data.student);
        setCourses(data.courses || []);
        if (data.courses && data.courses.length > 0) {
          setSelectedCourseId(data.courses[0].id);
        }
      } catch (err: any) {
        console.error("فشل تحميل بيانات الطالب:", err.message);
        setErrorMsg(err.message || "حدث خطأ أثناء تحميل بيانات الطالب.");
      } finally {
        setLoadingStudent(false);
      }
    }
    loadStudent();
  }, [studentId]);

  // 2. Load progress for selected course
  useEffect(() => {
    async function loadProgress() {
      if (!studentId || !selectedCourseId) return;
      try {
        setLoadingProgress(true);
        const data = await getAssistantStudentCourseProgress(studentId, selectedCourseId);
        setProgressData(data);
      } catch (err: any) {
        console.error("فشل تحميل متابعة الكورس:", err.message);
      } finally {
        setLoadingProgress(false);
      }
    }
    loadProgress();
  }, [studentId, selectedCourseId]);

  if (loadingStudent) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7D79F1]" size={36} />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="space-y-6 max-w-4xl" dir="rtl">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-center space-y-4">
          <p className="font-bold">{errorMsg}</p>
          <Link
            href="/assistant/students"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7D79F1] text-white rounded-xl font-bold text-xs"
          >
            <ArrowRight size={14} />
            العودة لقائمة الطلاب
          </Link>
        </div>
      </div>
    );
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className="space-y-8 max-w-6xl" dir="rtl">
      
      {/* Header & Back Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/assistant/students"
            className="p-3 bg-white border hover:bg-gray-50 rounded-2xl transition text-gray-500 shadow-sm"
            title="رجوع لقائمة الطلاب"
          >
            <ArrowRight size={20} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D2B7A]">
              تفاصيل الطالب
            </h1>
            <p className="text-gray-500 mt-0.5 text-xs md:text-sm font-semibold">
              متابعة مشاهدات الفيديو، حل الواجبات، ودرجات الكويزات للطالب
            </p>
          </div>
        </div>

        <Link
          href="/assistant/students"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition"
        >
          رجوع
        </Link>
      </div>

      {/* Student Information Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F3F2FF] text-[#7D79F1] font-black text-xl flex items-center justify-center shrink-0">
              {student?.full_name?.charAt(0) || "ط"}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[#2D2B7A]">
                {student?.full_name || "طالب بدون اسم"}
              </h2>
              <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold mt-1 flex-wrap">
                {student?.grade && <span>الصف: {student.grade}</span>}
                {student?.governorate && <span>المحافظة: {student.governorate}</span>}
                {student?.school && <span>المدرسة: {student.school}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            
            {/* Student Phone */}
            <div className="bg-[#F8F9FD] p-3.5 rounded-2xl border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7D79F1] flex items-center justify-center">
                <Phone size={18} />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block">رقم الطالب</span>
                <a
                  href={`tel:${student?.phone}`}
                  className="text-xs font-mono font-extrabold text-[#2D2B7A] hover:text-[#7D79F1] transition dir-ltr block text-right"
                >
                  {student?.phone || "غير مسجل"}
                </a>
              </div>
            </div>

            {/* Parent Phone */}
            <div className="bg-[#F8F9FD] p-3.5 rounded-2xl border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Phone size={18} />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block">رقم ولي الأمر</span>
                <a
                  href={`tel:${student?.parent_phone}`}
                  className="text-xs font-mono font-extrabold text-[#2D2B7A] hover:text-emerald-600 transition dir-ltr block text-right"
                >
                  {student?.parent_phone || "غير مسجل"}
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Enrolled Courses Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-500">
            الكورسات المشترك فيها الطالب (اختر كورس لعرض المتابعة):
          </label>
          
          {courses.length === 0 ? (
            <p className="text-xs text-gray-400 font-medium">الطالب غير مشترك في أي كورس حالياً.</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {courses.map((course) => {
                const isSelected = course.id === selectedCourseId;
                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 border cursor-pointer ${
                      isSelected
                        ? "bg-[#7D79F1] text-white border-[#7D79F1] shadow-md shadow-[#7D79F1]/20"
                        : "bg-[#F8F9FD] text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <BookOpen size={14} />
                    <span>{course.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Progress Content for Selected Course */}
      {loadingProgress ? (
        <div className="text-center py-16 bg-white rounded-3xl border">
          <Loader2 className="animate-spin text-[#7D79F1] mx-auto mb-3" size={36} />
          <p className="text-gray-500 font-bold text-sm">جاري تحميل متابعة الكورس والواجبات...</p>
        </div>
      ) : !progressData ? null : (
        <div className="space-y-8">
          
          {/* 1. Video Watch Tracking Section */}
          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-lg font-black text-[#2D2B7A] flex items-center gap-2">
                <Video className="text-[#7D79F1]" size={20} />
                مشاهدة الفيديوهات
              </h3>
              <span className="text-xs text-gray-400 font-bold">
                إجمالي الدروس: {progressData.videos.length}
              </span>
            </div>

            {progressData.videos.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-xs font-semibold">
                لا توجد محاضرات مضافة في هذا الكورس بعد.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead className="bg-[#F5F7FB] border-b text-[#2D2B7A] font-bold text-xs">
                    <tr>
                      <th className="p-3.5">الدرس</th>
                      <th className="p-3.5 text-center">حالة المشاهدة</th>
                      <th className="p-3.5 text-center">عدد مرات المشاهدة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700">
                    {progressData.videos.map((vid) => (
                      <tr key={vid.lessonId} className="hover:bg-[#F3F2FF]/20 transition">
                        
                        <td className="p-3.5 font-bold text-[#2D2B7A] text-xs">
                          {vid.order}. {vid.lessonTitle}
                        </td>

                        <td className="p-3.5 text-center">
                          {vid.isWatched ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                              <CheckCircle2 size={13} />
                              شاهد
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-200">
                              <XCircle size={13} />
                              لم يشاهد
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center font-mono font-bold text-xs text-gray-700">
                          {vid.viewsCount > 0 ? (
                            <span className="bg-purple-50 text-[#7D79F1] px-2.5 py-0.5 rounded-lg border border-purple-100">
                              {vid.viewsCount} مرة
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2. Homeworks Section */}
          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-lg font-black text-[#2D2B7A] flex items-center gap-2">
                <FileText className="text-[#7D79F1]" size={20} />
                الواجبات
              </h3>
              <span className="text-xs text-gray-400 font-bold">
                متابعة تسليمات ودرجات واجب كل محاضرة
              </span>
            </div>

            {progressData.homeworks.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-xs font-semibold">
                لا توجد واجبات مضافة لهذا الكورس بعد.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead className="bg-[#F5F7FB] border-b text-[#2D2B7A] font-bold text-xs">
                    <tr>
                      <th className="p-3.5">الدرس</th>
                      <th className="p-3.5 text-center">الحالة</th>
                      <th className="p-3.5 text-center">الدرجة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700">
                    {progressData.homeworks.map((hw) => (
                      <tr key={hw.lessonId} className="hover:bg-[#F3F2FF]/20 transition">
                        
                        <td className="p-3.5 font-bold text-[#2D2B7A] text-xs">
                          {hw.order}. {hw.lessonTitle}
                        </td>

                        <td className="p-3.5 text-center">
                          {hw.isSubmitted ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                              <CheckCircle2 size={13} />
                              تم الحل
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                              <XCircle size={13} />
                              لم يتم الحل
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center font-bold text-xs">
                          {hw.isSubmitted ? (
                            <span className="bg-purple-50 text-[#7D79F1] px-3 py-1 rounded-xl border border-purple-100 font-black">
                              {hw.scoreText}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-mono">—</span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. Quizzes & Exams Section */}
          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-lg font-black text-[#2D2B7A] flex items-center gap-2">
                <FileQuestion className="text-[#7D79F1]" size={20} />
                الكويزات والامتحانات
              </h3>
              <span className="text-xs text-gray-400 font-bold">
                نتائج كويزات الكورس والامتحانات الشاملة
              </span>
            </div>

            {progressData.quizzes.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-xs font-semibold">
                لا توجد كويزات مسجلة في هذا الكورس.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead className="bg-[#F5F7FB] border-b text-[#2D2B7A] font-bold text-xs">
                    <tr>
                      <th className="p-3.5">الدرس / التقييم</th>
                      <th className="p-3.5 text-center">نوع التقييم</th>
                      <th className="p-3.5 text-center">الحالة</th>
                      <th className="p-3.5 text-center">الدرجة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700">
                    {progressData.quizzes.map((quiz) => (
                      <tr key={quiz.quizId} className="hover:bg-[#F3F2FF]/20 transition">
                        
                        <td className="p-3.5">
                          <span className="font-bold text-[#2D2B7A] block text-xs">
                            {quiz.quizTitle}
                          </span>
                          {quiz.lessonTitle && (
                            <span className="text-[11px] text-gray-400 block mt-0.5">
                              {quiz.lessonTitle}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                            quiz.type === "final"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>
                            {quiz.type === "final" ? "امتحان شامل" : "كويز محاضرة"}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          {quiz.isSubmitted ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                              <CheckCircle2 size={13} />
                              تم الحل
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                              <XCircle size={13} />
                              لم يتم الحل
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center font-bold text-xs">
                          {quiz.isSubmitted ? (
                            <span className="bg-purple-50 text-[#7D79F1] px-3 py-1 rounded-xl border border-purple-100 font-black">
                              {quiz.scoreText}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-mono">—</span>
                          )}
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

    </div>
  );
}

export default function AssistantStudentDetailsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500 font-bold">جاري تحميل تفاصيل الطالب...</div>}>
      <StudentDetailsContent />
    </Suspense>
  );
}
