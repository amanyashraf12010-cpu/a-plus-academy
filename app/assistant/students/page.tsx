"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  getAssistantCourses, 
  getAssistantStudentsReport, 
  StudentFilterType 
} from "@/lib/assistant";
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  FileQuestion, 
  FileText, 
  Phone, 
  BookOpen, 
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

function AssistantStudentsContent() {
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get("courseId") || "all";

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId);
  const [activeFilter, setActiveFilter] = useState<StudentFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [coursesData, report] = await Promise.all([
        getAssistantCourses(),
        getAssistantStudentsReport(selectedCourseId, activeFilter),
      ]);
      setCourses(coursesData || []);
      setStudentsData(report || []);
    } catch (err: any) {
      console.error("فشل تحميل تقرير الطلاب:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedCourseId, activeFilter]);

  const filterTabs: Array<{ key: StudentFilterType; label: string }> = [
    { key: "all", label: "كل الطلاب" },
    { key: "watched_video", label: "شاهد الفيديو" },
    { key: "not_watched_video", label: "لم يشاهد الفيديو" },
    { key: "completed_quiz", label: "أكمل الكويز" },
    { key: "not_completed_quiz", label: "لم يكمل الكويز" },
    { key: "submitted_homework", label: "سلّم الواجب" },
    { key: "not_submitted_homework", label: "لم يسلّم الواجب" },
  ];

  // Client-side text search (by student name or phone)
  const filteredStudents = studentsData.filter((s) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      s.studentName.toLowerCase().includes(query) ||
      s.phone.includes(query) ||
      s.parentPhone.includes(query) ||
      s.courseTitle.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2D2B7A] flex items-center gap-3">
            <Users className="text-[#7D79F1]" size={32} />
            متابعة أداء الطلاب
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-semibold">
            متابعة تفصيلية لنسبة إكمال الكورس ومشاهدات الفيديو، نتائج الكويزات، وحالة تسليم الواجبات
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-5">
        
        {/* Course Selector & Search Input */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          
          <div className="w-full md:w-72">
            <label className="block text-xs font-bold text-gray-500 mb-1">اختر الكورس:</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-bold text-xs bg-white cursor-pointer focus:border-[#7D79F1]"
            >
              <option value="all">جميع الكورسات ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 mb-1">بحث بالاسم أو الهاتف:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث باسم الطالب أو رقم الهاتف..."
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] focus:border-[#7D79F1] text-xs font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3.5 top-3 text-gray-400" size={16} />
            </div>
          </div>

        </div>

        {/* 7 Arabic Filter Buttons */}
        <div className="border-t pt-4">
          <label className="block text-xs font-bold text-gray-500 mb-2">فلاتر الطلاب المعتمدة:</label>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? "bg-[#7D79F1] text-white border-[#7D79F1] shadow-sm shadow-[#7D79F1]/20"
                      : "bg-[#F8F9FD] text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Students Data Table */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border">
          <Loader2 className="animate-spin text-[#7D79F1] mx-auto mb-3" size={36} />
          <p className="text-gray-500 font-bold">جاري تحميل تقارير الطلاب...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl border p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold text-[#2D2B7A]">لا توجد نتائج مطابقة</h3>
          <p className="text-gray-400 text-sm">
            جربي تغيير الفلتر أو اختيار كورس آخر لعرض بيانات الطلاب.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-[#F5F7FB] border-b text-[#2D2B7A] font-bold">
                <tr>
                  <th className="p-4">اسم الطالب</th>
                  <th className="p-4">الكورس</th>
                  <th className="p-4 text-center">نسبة الإكمال</th>
                  <th className="p-4 text-center">مشاهدات الفيديو</th>
                  <th className="p-4 text-center">الكويز</th>
                  <th className="p-4 text-center">الواجب</th>
                  <th className="p-4 text-center">تفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {filteredStudents.map((item, idx) => {
                  const isExpanded = expandedStudentId === `${item.studentId}_${item.courseId}`;

                  return (
                    <div key={`${item.studentId}_${item.courseId}_wrapper`} className="contents">
                      <tr className="hover:bg-[#F3F2FF]/20 transition">
                        <td className="p-4">
                          <div>
                            <span className="font-extrabold text-[#2D2B7A] block text-sm">
                              {item.studentName}
                            </span>
                            <span className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <Phone size={11} />
                              {item.phone} | ولي الأمر: {item.parentPhone}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-xs font-bold text-gray-700">
                          {item.courseTitle}
                        </td>

                        <td className="p-4 text-center">
                          <span className="bg-purple-50 text-[#7D79F1] px-3 py-1 rounded-full text-xs font-black border border-purple-200">
                            {item.progress}%
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          {item.hasWatchedVideo ? (
                            <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[11px] font-bold border border-green-200 inline-flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              شاهد ({item.watchedLessonsCount} من {item.totalLessonsCount})
                            </span>
                          ) : (
                            <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[11px] font-bold border border-red-200 inline-flex items-center gap-1">
                              <XCircle size={12} />
                              لم يشاهد
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          {item.hasCompletedQuiz ? (
                            <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[11px] font-bold border border-green-200 inline-flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              حل الكويز ({item.completedQuizzesCount} من {item.totalQuizzesCount})
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-[11px] font-bold border border-gray-200 inline-flex items-center gap-1">
                              <XCircle size={12} />
                              لم يحل الكويز
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          {item.submittedHomework ? (
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-bold border border-blue-200 inline-flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              سلّم الواجب
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-bold border border-amber-200 inline-flex items-center gap-1">
                              <XCircle size={12} />
                              لم يسلّم
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <button
                            onClick={() => setExpandedStudentId(isExpanded ? null : `${item.studentId}_${item.courseId}`)}
                            className="p-2 rounded-xl bg-purple-50 text-[#7D79F1] hover:bg-purple-100 transition cursor-pointer font-bold text-xs"
                            title="عرض تفاصيل المحاضرات المشاهدة وغير المشاهدة"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-[#F8F9FD]">
                          <td colSpan={7} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              
                              {/* Watched Lectures */}
                              <div className="bg-white p-4 rounded-2xl border space-y-2">
                                <h4 className="text-xs font-bold text-green-700 flex items-center gap-1.5">
                                  <CheckCircle2 size={14} />
                                  المحاضرات التي تم مشاهدتها ({item.watchedLessonsTitles.length}):
                                </h4>
                                {item.watchedLessonsTitles.length === 0 ? (
                                  <p className="text-xs text-gray-400">لم يشاهد أي محاضرة بعد.</p>
                                ) : (
                                  <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                                    {item.watchedLessonsTitles.map((title: string, tIdx: number) => (
                                      <li key={tIdx} className="font-medium">{title}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              {/* Unwatched Lectures */}
                              <div className="bg-white p-4 rounded-2xl border space-y-2">
                                <h4 className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                                  <XCircle size={14} />
                                  المحاضرات التي لم يشاهدها بعد ({item.unwatchedLessonsTitles.length}):
                                </h4>
                                {item.unwatchedLessonsTitles.length === 0 ? (
                                  <p className="text-xs text-green-600 font-bold">شاهد جميع المحاضرات المتاحة 🎉</p>
                                ) : (
                                  <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                                    {item.unwatchedLessonsTitles.map((title: string, tIdx: number) => (
                                      <li key={tIdx} className="font-medium">{title}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </div>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AssistantStudentsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500 font-bold">جاري تحميل تقارير الطلاب...</div>}>
      <AssistantStudentsContent />
    </Suspense>
  );
}
