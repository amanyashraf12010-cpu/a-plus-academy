"use client";

import { useEffect, useState, useTransition } from "react";
import { 
  getCourseAccessList, 
  getStudentCourseAccesses, 
  searchStudentsForAccess, 
  grantCourseAccess, 
  revokeCourseAccess, 
  transferCourseAccess, 
  getCourseAccessStats,
  CourseAccessItem,
  StudentProfile 
} from "@/lib/course-access";
import { getCourses } from "@/lib/admin";
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  RefreshCw, 
  ArrowRightLeft, 
  Ban, 
  CheckCircle2, 
  User, 
  BookOpen, 
  Calendar, 
  X, 
  Loader2, 
  AlertTriangle, 
  History,
  Phone,
  Mail,
  GraduationCap,
  Sparkles,
  Layers,
  KeyRound
} from "lucide-react";

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

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
}

export default function CourseAccessManagementPage() {
  const [accessList, setAccessList] = useState<CourseAccessItem[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    revoked: 0,
    transferred: 0,
    manual: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accessTypeFilter, setAccessTypeFilter] = useState("all");

  // Selected Student for details sidebar
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentProfile | null>(null);
  const [studentHistory, setStudentHistory] = useState<CourseAccessItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Grant Modal
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantSearchQuery, setGrantSearchQuery] = useState("");
  const [grantSearchResults, setGrantSearchResults] = useState<StudentProfile[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedGrantStudent, setSelectedGrantStudent] = useState<StudentProfile | null>(null);
  const [selectedGrantCourseId, setSelectedGrantCourseId] = useState("");
  const [selectedGrantAccessType, setSelectedGrantAccessType] = useState<"manual" | "free">("manual");
  const [grantSubmitting, setGrantSubmitting] = useState(false);

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferItem, setTransferItem] = useState<CourseAccessItem | null>(null);
  const [selectedTargetCourseId, setSelectedTargetCourseId] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // Revoke Modal
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeItem, setRevokeItem] = useState<CourseAccessItem | null>(null);
  const [revokeSubmitting, setRevokeSubmitting] = useState(false);

  // Load Main Data
  async function loadData() {
    try {
      setLoading(true);
      const [accessData, coursesData, statsData] = await Promise.all([
        getCourseAccessList({
          search: searchTerm,
          courseId: courseFilter,
          status: statusFilter,
          accessType: accessTypeFilter,
        }),
        getCourses(),
        getCourseAccessStats(),
      ]);

      setAccessList(accessData);
      setAllCourses(coursesData || []);
      setStats(statsData);
    } catch (error: any) {
      console.error("Error loading access data:", error);
      alert("فشل تحميل بيانات الصلاحيات: " + (error?.message || "خطأ غير متوقع"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [courseFilter, statusFilter, accessTypeFilter]);

  // Debounced search on main table
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load student history sidebar
  async function loadStudentHistory(student: StudentProfile) {
    setSelectedStudentId(student.id);
    setSelectedStudentProfile(student);
    try {
      setLoadingHistory(true);
      const history = await getStudentCourseAccesses(student.id);
      setStudentHistory(history);
    } catch (error) {
      console.error("Error loading student access history:", error);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Student search for grant modal
  useEffect(() => {
    if (!showGrantModal || grantSearchQuery.trim().length === 0) {
      setGrantSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingStudents(true);
        const results = await searchStudentsForAccess(grantSearchQuery);
        setGrantSearchResults(results);
      } catch (err) {
        console.error("Error searching students:", err);
      } finally {
        setSearchingStudents(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [grantSearchQuery, showGrantModal]);

  // Handle Grant Access
  async function handleGrantSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGrantStudent) {
      alert("يرجى اختيار الطالب أولاً.");
      return;
    }
    if (!selectedGrantCourseId) {
      alert("يرجى اختيار الكورس.");
      return;
    }

    try {
      setGrantSubmitting(true);
      await grantCourseAccess(selectedGrantStudent.id, selectedGrantCourseId, selectedGrantAccessType);
      alert("✅ تم منح صلاحية الوصول للكورس بنجاح!");
      setShowGrantModal(false);
      setSelectedGrantStudent(null);
      setSelectedGrantCourseId("");
      setGrantSearchQuery("");
      loadData();
      if (selectedStudentProfile?.id === selectedGrantStudent.id) {
        loadStudentHistory(selectedGrantStudent);
      }
    } catch (err: any) {
      alert("❌ فشل منح الصلاحية: " + err.message);
    } finally {
      setGrantSubmitting(false);
    }
  }

  // Handle Transfer Access
  async function handleTransferSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transferItem) return;
    if (!selectedTargetCourseId) {
      alert("يرجى اختيار الكورس البديل.");
      return;
    }

    try {
      setTransferSubmitting(true);
      await transferCourseAccess(transferItem.student_id, transferItem.course_id, selectedTargetCourseId);
      alert("✅ تم نقل صلاحية الطالب للكورس الجديد بنجاح!");
      setShowTransferModal(false);
      setTransferItem(null);
      setSelectedTargetCourseId("");
      loadData();
      if (selectedStudentProfile?.id === transferItem.student_id) {
        loadStudentHistory(selectedStudentProfile);
      }
    } catch (err: any) {
      alert("❌ فشل نقل الصلاحية: " + err.message);
    } finally {
      setTransferSubmitting(false);
    }
  }

  // Handle Revoke Access
  async function handleRevokeSubmit() {
    if (!revokeItem) return;

    try {
      setRevokeSubmitting(true);
      await revokeCourseAccess(revokeItem.student_id, revokeItem.course_id);
      alert("تم إلغاء صلاحية الوصول للكورس بنجاح.");
      setShowRevokeModal(false);
      const studentId = revokeItem.student_id;
      setRevokeItem(null);
      loadData();
      if (selectedStudentProfile?.id === studentId) {
        loadStudentHistory(selectedStudentProfile);
      }
    } catch (err: any) {
      alert("❌ فشل إلغاء الصلاحية: " + err.message);
    } finally {
      setRevokeSubmitting(false);
    }
  }

  // Handle Re-grant Access directly
  async function handleReactivateAccess(item: CourseAccessItem) {
    if (!confirm(`هل تريد إعادة تفعيل صلاحية كورس "${item.courses?.title}" للطالب "${item.profiles?.full_name}"؟`)) {
      return;
    }
    try {
      await grantCourseAccess(item.student_id, item.course_id, item.access_type === "transfer" ? "manual" : item.access_type);
      alert("✅ تم إعادة تفعيل صلاحية الكورس بنجاح.");
      loadData();
      if (selectedStudentProfile?.id === item.student_id) {
        loadStudentHistory(selectedStudentProfile);
      }
    } catch (err: any) {
      alert("❌ فشل إعادة التفعيل: " + err.message);
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F3F2FF] text-[#7D79F1] rounded-2xl">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#2D2B7A]">
                إدارة صلاحيات الكورسات
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                التحكم اليدوي المباشر في صلاحيات وصول الطلاب للكورسات (منح، إلغاء، ونقل) دون الحاجة لمدفوعات
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedGrantStudent(null);
              setSelectedGrantCourseId("");
              setGrantSearchQuery("");
              setShowGrantModal(true);
            }}
            className="px-5 py-3 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold transition shadow-sm hover:shadow flex items-center gap-2 text-sm cursor-pointer"
          >
            <Plus size={18} />
            منح صلاحية كورس جديد
          </button>
          
          <button
            onClick={loadData}
            title="تحديث البيانات"
            className="p-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#2D2B7A] rounded-xl transition shadow-xs cursor-pointer"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Card */}
        <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold">الصلاحيات الفعالة</p>
            <h3 className="text-2xl font-black text-[#2D2B7A] mt-0.5">{stats.active}</h3>
          </div>
        </div>

        {/* Manual Granted Card */}
        <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#7D79F1] flex items-center justify-center font-bold shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold">ممنوحة يدويًا</p>
            <h3 className="text-2xl font-black text-[#2D2B7A] mt-0.5">{stats.manual}</h3>
          </div>
        </div>

        {/* Transferred Card */}
        <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <ArrowRightLeft size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold">صلاحيات منقولة</p>
            <h3 className="text-2xl font-black text-[#2D2B7A] mt-0.5">{stats.transferred}</h3>
          </div>
        </div>

        {/* Revoked Card */}
        <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
            <Ban size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold">صلاحيات ملغاة</p>
            <h3 className="text-2xl font-black text-[#2D2B7A] mt-0.5">{stats.revoked}</h3>
          </div>
        </div>

      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-2xl border shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="ابحث بالطالب، الهاتف، أو الكورس..."
            className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-3.5 top-3.5 text-gray-400" size={18} />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Course Filter */}
          <select
            className="px-4 py-3 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-semibold bg-white cursor-pointer focus:border-[#7D79F1] text-xs md:text-sm"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            <option value="all">كل الكورسات</option>
            {allCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="px-4 py-3 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-semibold bg-white cursor-pointer focus:border-[#7D79F1] text-xs md:text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">كل الحالات</option>
            <option value="active">الصلاحيات الفعالة فقط</option>
            <option value="revoked">الصلاحيات الملغاة</option>
          </select>

          {/* Access Type Filter */}
          <select
            className="px-4 py-3 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-semibold bg-white cursor-pointer focus:border-[#7D79F1] text-xs md:text-sm"
            value={accessTypeFilter}
            onChange={(e) => setAccessTypeFilter(e.target.value)}
          >
            <option value="all">كل أنواع الصلاحيات</option>
            <option value="manual">يدوي (Manual)</option>
            <option value="transfer">نقل (Transfer)</option>
            <option value="payment">دفع (Payment)</option>
            <option value="free">مجاني (Free)</option>
          </select>
        </div>

      </div>

      {/* Main Grid: Table & Student History Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table Container */}
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-gray-500 font-bold flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[#7D79F1]" size={32} />
              <span>جاري تحميل بيانات صلاحيات الكورسات...</span>
            </div>
          ) : accessList.length === 0 ? (
            <div className="p-16 text-center text-gray-500 font-bold flex flex-col items-center justify-center gap-2">
              <KeyRound size={40} className="text-gray-300" />
              <p className="text-base text-[#2D2B7A]">لا توجد صلاحيات مسجلة تطابق خيارات البحث.</p>
              <p className="text-xs text-gray-400">يمكنك منح صلاحية كورس جديد لأي طالب بالضغط على زر "منح صلاحية كورس جديد" بالأعلى.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-[#F5F7FB] border-b text-[#2D2B7A] font-bold text-xs">
                  <tr>
                    <th className="p-4">الطالب</th>
                    <th className="p-4">الكورس</th>
                    <th className="p-4 text-center">النوع</th>
                    <th className="p-4 text-center">الحالة</th>
                    <th className="p-4">تاريخ المنح</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700 text-sm">
                  {accessList.map((item) => {
                    const isActive = item.status === "active";
                    const isSelected = selectedStudentProfile?.id === item.student_id;

                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-[#F3F2FF]/40 transition ${isSelected ? "bg-[#F3F2FF]/60 font-semibold" : ""}`}
                      >
                        {/* Student Info */}
                        <td className="p-4">
                          <div 
                            className="cursor-pointer group"
                            onClick={() => item.profiles && loadStudentHistory(item.profiles)}
                          >
                            <span className="font-bold text-[#2D2B7A] group-hover:text-[#7D79F1] transition flex items-center gap-1.5">
                              {item.profiles?.full_name || "طالب غير معروف"}
                            </span>
                            <span className="block text-xs text-gray-400 font-normal">
                              {item.profiles?.phone || item.profiles?.email || "-"}
                            </span>
                            {item.profiles?.grade && (
                              <span className="text-[10px] text-gray-400 font-medium">
                                {mapGradeToArabic(item.profiles.grade)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Course Info */}
                        <td className="p-4">
                          <p className="font-bold text-[#2D2B7A]">{item.courses?.title || "كورس غير معروف"}</p>
                          <p className="text-xs text-gray-400">
                            {item.courses?.teachers?.name ? `المدرس: ${item.courses.teachers.name}` : ""}
                          </p>
                        </td>

                        {/* Access Type Badge */}
                        <td className="p-4 text-center">
                          {item.access_type === "manual" && (
                            <span className="px-2.5 py-1 bg-purple-50 text-[#7D79F1] border border-purple-200 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                              <span>✨</span> يدوي
                            </span>
                          )}
                          {item.access_type === "transfer" && (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                              <ArrowRightLeft size={11} /> نقل
                            </span>
                          )}
                          {item.access_type === "payment" && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold">
                              💳 دفع
                            </span>
                          )}
                          {item.access_type === "free" && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                              🎁 مجاني
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                              isActive
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-600 border border-red-200"
                            }`}
                          >
                            {isActive ? "مفعل 🟢" : "ملغى ⛔"}
                          </span>
                        </td>

                        {/* Date Granted */}
                        <td className="p-4 text-xs text-gray-500 font-medium">
                          {formatDate(item.granted_at)}
                          {item.granted_by_profile && (
                            <span className="block text-[10px] text-gray-400">
                              بواسطة: {item.granted_by_profile.full_name}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* View History Button */}
                            {item.profiles && (
                              <button
                                onClick={() => loadStudentHistory(item.profiles!)}
                                title="عرض سجل صلاحيات الطالب"
                                className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-[#F3F2FF] hover:text-[#7D79F1] transition cursor-pointer"
                              >
                                <History size={16} />
                              </button>
                            )}

                            {/* Transfer Button (Only for active access) */}
                            {isActive && (
                              <button
                                onClick={() => {
                                  setTransferItem(item);
                                  setSelectedTargetCourseId("");
                                  setShowTransferModal(true);
                                }}
                                title="نقل الصلاحية لكورس آخر"
                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                              >
                                <ArrowRightLeft size={16} />
                              </button>
                            )}

                            {/* Revoke Button (Only for active access) */}
                            {isActive && (
                              <button
                                onClick={() => {
                                  setRevokeItem(item);
                                  setShowRevokeModal(true);
                                }}
                                title="إلغاء الصلاحية"
                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                              >
                                <Ban size={16} />
                              </button>
                            )}

                            {/* Reactivate Button (Only for revoked access) */}
                            {!isActive && (
                              <button
                                onClick={() => handleReactivateAccess(item)}
                                title="إعادة تفعيل الصلاحية"
                                className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition cursor-pointer"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Student Access Details Sidebar */}
        <div className="bg-white p-6 rounded-2xl border shadow-xs h-fit space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-extrabold text-[#2D2B7A] flex items-center gap-2">
              <History size={20} className="text-[#7D79F1]" />
              سجل صلاحيات الطالب
            </h2>
            {selectedStudentProfile && (
              <button
                onClick={() => {
                  setSelectedStudentId(null);
                  setSelectedStudentProfile(null);
                  setStudentHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="إغلاق"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {selectedStudentProfile ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Student Bio Card */}
              <div className="bg-[#F8F9FD] p-4 rounded-xl border space-y-2.5 text-xs text-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#2D2B7A]">
                    {selectedStudentProfile.full_name}
                  </h3>
                  <span className="px-2 py-0.5 bg-purple-100 text-[#7D79F1] font-bold rounded-md text-[10px]">
                    {mapGradeToArabic(selectedStudentProfile.grade)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={13} className="text-gray-400" />
                  <span>{selectedStudentProfile.phone}</span>
                </div>

                {selectedStudentProfile.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={13} className="text-gray-400" />
                    <span>{selectedStudentProfile.email}</span>
                  </div>
                )}

                {selectedStudentProfile.school && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <GraduationCap size={13} className="text-gray-400" />
                    <span>{selectedStudentProfile.school}</span>
                  </div>
                )}
              </div>

              {/* Quick Action for this student */}
              <button
                onClick={() => {
                  setSelectedGrantStudent(selectedStudentProfile);
                  setSelectedGrantCourseId("");
                  setShowGrantModal(true);
                }}
                className="w-full py-2.5 px-3 bg-[#F3F2FF] hover:bg-[#E9E7FF] text-[#7D79F1] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={15} />
                منح كورس جديد لهذا الطالب
              </button>

              {/* Courses History List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#2D2B7A] flex items-center gap-1.5">
                  <BookOpen size={14} className="text-gray-400" />
                  الكورسات الممنوحة والسابقة:
                </h4>

                {loadingHistory ? (
                  <div className="text-center py-6 text-xs text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin text-[#7D79F1]" />
                    جاري جلب سجل الكورسات...
                  </div>
                ) : studentHistory.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl border">
                    لا توجد صلاحيات مسجلة لهذا الطالب بعد.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {studentHistory.map((item) => {
                      const isActive = item.status === "active";
                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-2 transition ${
                            isActive
                              ? "bg-emerald-50/40 border-emerald-200"
                              : "bg-red-50/30 border-red-200 opacity-80"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-[#2D2B7A] line-clamp-1">
                              {item.courses?.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {isActive ? "مفعل" : "ملغى"}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1 border-t border-gray-200/50">
                            <span>النوع: <strong>{item.access_type}</strong></span>
                            <span>{formatDate(item.granted_at)}</span>
                          </div>

                          {/* Actions inside sidebar */}
                          <div className="flex gap-2 pt-1">
                            {isActive ? (
                              <>
                                <button
                                  onClick={() => {
                                    setTransferItem(item);
                                    setSelectedTargetCourseId("");
                                    setShowTransferModal(true);
                                  }}
                                  className="flex-1 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
                                >
                                  <ArrowRightLeft size={12} />
                                  نقل
                                </button>
                                <button
                                  onClick={() => {
                                    setRevokeItem(item);
                                    setShowRevokeModal(true);
                                  }}
                                  className="flex-1 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
                                >
                                  <Ban size={12} />
                                  إلغاء
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleReactivateAccess(item)}
                                className="w-full py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 size={12} />
                                إعادة التفعيل
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 text-xs flex flex-col items-center justify-center gap-3">
              <User size={36} className="text-gray-300" />
              <span>اضغط على اسم أي طالب في الجدول لعرض كامل سجله وتفاصيل كورساته هنا.</span>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: Grant Access (منح صلاحية) */}
      {/* ========================================================================= */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-[#7D79F1] rounded-xl">
                  <Plus size={20} />
                </div>
                <h3 className="text-xl font-extrabold text-[#2D2B7A]">منح صلاحية كورس لطالب</h3>
              </div>
              <button
                onClick={() => setShowGrantModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGrantSubmit} className="space-y-5">
              
              {/* Step 1: Select Student */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">
                  1. اختيار الطالب المراد منحه الصلاحية <span className="text-red-500">*</span>
                </label>

                {selectedGrantStudent ? (
                  <div className="flex items-center justify-between p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
                    <div className="text-xs">
                      <p className="font-bold text-[#2D2B7A] text-sm">{selectedGrantStudent.full_name}</p>
                      <p className="text-gray-500">{selectedGrantStudent.phone} • {mapGradeToArabic(selectedGrantStudent.grade)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedGrantStudent(null)}
                      className="text-xs font-bold text-red-500 hover:text-red-700 p-1"
                    >
                      تغيير
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ابحث بالاسم، رقم الهاتف، أو البريد..."
                        className="w-full pl-4 pr-9 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none"
                        value={grantSearchQuery}
                        onChange={(e) => setGrantSearchQuery(e.target.value)}
                      />
                      <Search className="absolute right-3 top-3 text-gray-400" size={15} />
                    </div>

                    {searchingStudents ? (
                      <p className="text-xs text-gray-400 text-center py-2">جاري البحث...</p>
                    ) : grantSearchResults.length > 0 ? (
                      <div className="max-h-40 overflow-y-auto divide-y border rounded-xl bg-white shadow-xs">
                        {grantSearchResults.map((st) => (
                          <div
                            key={st.id}
                            onClick={() => setSelectedGrantStudent(st)}
                            className="p-2.5 hover:bg-[#F3F2FF] cursor-pointer text-xs flex justify-between items-center transition"
                          >
                            <div>
                              <p className="font-bold text-[#2D2B7A]">{st.full_name}</p>
                              <p className="text-[10px] text-gray-400">{st.phone} • {mapGradeToArabic(st.grade)}</p>
                            </div>
                            <span className="text-[10px] font-bold text-[#7D79F1] bg-purple-50 px-2 py-0.5 rounded">
                              اختيار
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : grantSearchQuery.trim() !== "" ? (
                      <p className="text-xs text-gray-400 text-center py-2">لم يتم العثور على طلاب.</p>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Step 2: Select Course */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">
                  2. الكورس المراد منحه <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-xs md:text-sm font-semibold text-[#2D2B7A] outline-none focus:border-[#7D79F1] bg-white cursor-pointer"
                  value={selectedGrantCourseId}
                  onChange={(e) => setSelectedGrantCourseId(e.target.value)}
                >
                  <option value="">-- اختر الكورس --</option>
                  {allCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} {c.teachers?.name ? `(${c.teachers.name})` : ""} - {c.price} ج
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Access Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">
                  3. نوع المنح
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition ${
                    selectedGrantAccessType === "manual"
                      ? "bg-purple-50 border-[#7D79F1] text-[#7D79F1]"
                      : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}>
                    <input
                      type="radio"
                      name="accessType"
                      value="manual"
                      checked={selectedGrantAccessType === "manual"}
                      onChange={() => setSelectedGrantAccessType("manual")}
                      className="text-[#7D79F1]"
                    />
                    منح يدوي (Manual)
                  </label>

                  <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition ${
                    selectedGrantAccessType === "free"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                      : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}>
                    <input
                      type="radio"
                      name="accessType"
                      value="free"
                      checked={selectedGrantAccessType === "free"}
                      onChange={() => setSelectedGrantAccessType("free")}
                      className="text-emerald-600"
                    />
                    منح مجاني (Free)
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={grantSubmitting}
                  className="flex-1 py-3 px-4 bg-[#7D79F1] hover:bg-[#655EF0] text-white rounded-xl font-bold transition text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {grantSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      جاري منح الصلاحية...
                    </>
                  ) : (
                    "تأكيد ومنح الصلاحية الآن"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition text-xs md:text-sm cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Modal: Transfer Access (نقل صلاحية) */}
      {/* ========================================================================= */}
      {showTransferModal && transferItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <ArrowRightLeft size={20} />
                </div>
                <h3 className="text-xl font-extrabold text-[#2D2B7A]">نقل صلاحية كورس</h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-5">
              
              {/* Student & Current Course Details */}
              <div className="bg-gray-50 p-4 rounded-xl border space-y-2 text-xs">
                <p><strong>الطالب:</strong> {transferItem.profiles?.full_name} ({transferItem.profiles?.phone})</p>
                <p><strong>الكورس الحالي المصرح به:</strong> <span className="text-red-600 font-bold">{transferItem.courses?.title}</span></p>
              </div>

              {/* Target Course Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">
                  اختر الكورس الجديد المراد التحويل إليه <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-xs md:text-sm font-semibold text-[#2D2B7A] outline-none focus:border-[#7D79F1] bg-white cursor-pointer"
                  value={selectedTargetCourseId}
                  onChange={(e) => setSelectedTargetCourseId(e.target.value)}
                >
                  <option value="">-- اختر الكورس البديل --</option>
                  {allCourses
                    .filter((c) => c.id !== transferItem.course_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} {c.teachers?.name ? `(${c.teachers.name})` : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs leading-5">
                ℹ️ <strong>ملاحظة:</strong> سيتم إلغاء صلاحية الطالب في الكورس الحالي وتفعيل وصوله الفوري للكورس الجديد مباشرة.
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={transferSubmitting}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {transferSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      جاري تنفيذ النقل...
                    </>
                  ) : (
                    "تأكيد نقل الصلاحية"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition text-xs md:text-sm cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Modal: Revoke Confirmation (إلغاء صلاحية) */}
      {/* ========================================================================= */}
      {showRevokeModal && revokeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-[#2D2B7A]">تأكيد إلغاء الصلاحية</h3>
            </div>

            <div className="space-y-3 text-xs text-gray-700 bg-red-50/50 p-4 rounded-xl border border-red-200 leading-6">
              <p>هل أنت متأكد من رغبتك في إلغاء صلاحية وصول الطالب:</p>
              <p className="font-bold text-[#2D2B7A] text-sm">👤 {revokeItem.profiles?.full_name}</p>
              <p>إلى كورس: <strong className="text-red-600">{revokeItem.courses?.title}</strong>؟</p>
              <p className="text-[11px] text-gray-500 pt-2 border-t border-red-200">
                ⚠️ سيفقد الطالب صلاحية مشاهدة الفيديوهات والامتحانات فوراً، وستظل جميع درجاته ومحاولاته السابقة محفوظة بأمان.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleRevokeSubmit}
                disabled={revokeSubmitting}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {revokeSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    جاري الإلغاء...
                  </>
                ) : (
                  "نعم، إلغاء الصلاحية"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition text-xs md:text-sm cursor-pointer"
              >
                تراجع
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
