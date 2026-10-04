"use client";

import React, { useState, useMemo } from "react";
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  CheckSquare, 
  Square, 
  Filter, 
  Layers, 
  Users, 
  Table, 
  Calendar, 
  Check, 
  AlertCircle, 
  Loader2, 
  GraduationCap, 
  BookOpen, 
  Sparkles 
} from "lucide-react";

interface StudentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allStudents: any[];
  currentFilteredStudents: any[];
  allCourses: any[];
}

interface ColumnOption {
  key: string;
  label: string;
  category: "basic" | "courses" | "progress";
}

const AVAILABLE_COLUMNS: ColumnOption[] = [
  // Basic Info
  { key: "id", label: "كود الطالب (ID)", category: "basic" },
  { key: "full_name", label: "اسم الطالب", category: "basic" },
  { key: "email", label: "البريد الإلكتروني", category: "basic" },
  { key: "phone", label: "رقم الهاتف", category: "basic" },
  { key: "parent_phone", label: "رقم ولي الأمر", category: "basic" },
  { key: "parent_job", label: "وظيفة ولي الأمر", category: "basic" },
  { key: "school", label: "المدرسة", category: "basic" },
  { key: "governorate", label: "المحافظة", category: "basic" },
  { key: "gender", label: "النوع (الجنس)", category: "basic" },
  { key: "education_system", label: "النظام التعليمي", category: "basic" },
  { key: "track", label: "الشعبة / المسار", category: "basic" },
  { key: "grade", label: "الصف الدراسي", category: "basic" },
  { key: "created_at", label: "تاريخ التسجيل", category: "basic" },
  { key: "is_approved", label: "حالة الحساب", category: "basic" },

  // Courses & Subscriptions
  { key: "courses", label: "الكورسات المشترك بها", category: "courses" },
  { key: "course_count", label: "عدد الكورسات", category: "courses" },
  { key: "subscription_status", label: "حالة الاشتراك", category: "courses" },

  // Progress & Quizzes
  { key: "progress_percent", label: "نسبة التقدم الإجمالية (%)", category: "progress" },
  { key: "completed_lessons", label: "عدد الدروس المكتملة", category: "progress" },
  { key: "remaining_lessons", label: "عدد الدروس المتبقية", category: "progress" },
  { key: "quizzes_count", label: "عدد الاختبارات المنجزة", category: "progress" },
  { key: "average_score", label: "متوسط درجات الاختبارات (%)", category: "progress" },
  { key: "passed_quizzes", label: "عدد الاختبارات الناجحة", category: "progress" },
  { key: "failed_quizzes", label: "عدد الاختبارات غير الناجحة", category: "progress" },
];

const BASIC_COLUMN_KEYS = AVAILABLE_COLUMNS.filter(c => c.category === "basic").map(c => c.key);
const ALL_COLUMN_KEYS = AVAILABLE_COLUMNS.map(c => c.key);

const EGYPTIAN_GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", 
  "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", 
  "الوادي الجديد", "السويس", "أسوان", "أسيوط", "بني سويف", "بورسعيد", 
  "دمياط", "الشرقية", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهاج"
];

function mapGradeToArabic(grade: string) {
  switch (grade) {
    case "first": return "الصف الأول الثانوي";
    case "second": return "الصف الثاني الثانوي";
    case "third": return "الصف الثالث الثانوي";
    case "prep3": return "الصف الثالث الإعدادي";
    default: return grade || "غير محدد";
  }
}

function mapEducationSystemToArabic(sys: string, grade?: string) {
  const isPrep = grade === "prep3";
  const prefix = isPrep ? "إعدادي" : "ثانوي";
  switch (sys) {
    case "general": return `${prefix} عام`;
    case "azhar": return `${prefix} أزهر`;
    case "general_baccalaureate": return `${prefix} عام (بكالوريا)`;
    case "azhar_baccalaureate": return `${prefix} أزهر (بكالوريا)`;
    default: return sys || "غير محدد";
  }
}

export default function StudentExportModal({
  isOpen,
  onClose,
  allStudents,
  currentFilteredStudents,
  allCourses,
}: StudentExportModalProps) {
  // Scope: "current" (filtered) or "all" (all in db/state)
  const [scope, setScope] = useState<"current" | "all">("current");

  // Filter states
  const [gradeFilter, setGradeFilter] = useState("");
  const [systemFilter, setSystemFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const [governorateFilter, setGovernorateFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Selected Columns state (Default: Basic info + courses)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "full_name",
    "phone",
    "parent_phone",
    "grade",
    "education_system",
    "governorate",
    "is_approved",
    "courses",
    "created_at"
  ]);

  // Loading & Error states
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"filters" | "columns" | "preview">("columns");

  // Toggle single column
  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Quick select helpers
  const handleSelectAll = () => setSelectedColumns(ALL_COLUMN_KEYS);
  const handleDeselectAll = () => setSelectedColumns([]);
  const handleSelectBasicOnly = () => setSelectedColumns(BASIC_COLUMN_KEYS);

  // Compute live filtered students for preview & summary count
  const previewStudents = useMemo(() => {
    let list = scope === "current" ? currentFilteredStudents : allStudents;

    if (gradeFilter) {
      list = list.filter((s) => s.grade === gradeFilter);
    }
    if (systemFilter) {
      list = list.filter((s) => s.education_system === systemFilter);
    }
    if (trackFilter) {
      list = list.filter((s) => s.track === trackFilter);
    }
    if (governorateFilter) {
      list = list.filter((s) => s.governorate === governorateFilter);
    }
    if (genderFilter) {
      list = list.filter((s) => s.gender === genderFilter);
    }
    if (statusFilter !== "all") {
      const isApproved = statusFilter === "approved";
      list = list.filter((s) => s.is_approved === isApproved);
    }
    if (dateFrom) {
      list = list.filter((s) => s.created_at && new Date(s.created_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      list = list.filter((s) => s.created_at && new Date(s.created_at) <= end);
    }

    return list;
  }, [
    scope,
    allStudents,
    currentFilteredStudents,
    gradeFilter,
    systemFilter,
    trackFilter,
    governorateFilter,
    genderFilter,
    statusFilter,
    dateFrom,
    dateTo,
  ]);

  if (!isOpen) return null;

  // Handle Export API submission
  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      setExportError("يرجى اختيار عمود واحد على الأقل للتصدير.");
      return;
    }

    try {
      setIsExporting(true);
      setExportError(null);

      const targetStudentIds = previewStudents.map((s) => s.id);

      const payload = {
        scope: scope === "current" || (scope === "all" && (gradeFilter || systemFilter || trackFilter || governorateFilter || genderFilter || statusFilter !== "all" || dateFrom || dateTo || courseFilter))
          ? "current"
          : "all",
        studentIds: targetStudentIds,
        filters: {
          grade: gradeFilter || undefined,
          education_system: systemFilter || undefined,
          track: trackFilter || undefined,
          governorate: governorateFilter || undefined,
          gender: genderFilter || undefined,
          is_approved: statusFilter !== "all" ? statusFilter : undefined,
          course_id: courseFilter || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
        selectedColumns,
      };

      const response = await fetch("/api/admin/students/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `فشل تصدير الملف (${response.status})`);
      }

      // Download file stream
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().split("T")[0];
      a.download = `بيانات_الطلاب_A_Plus_${timestamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Close modal on success
      onClose();
    } catch (err: any) {
      console.error("Export error:", err);
      setExportError(err.message || "حدث خطأ غير متوقع أثناء تصدير ملف Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  const basicCols = AVAILABLE_COLUMNS.filter((c) => c.category === "basic");
  const courseCols = AVAILABLE_COLUMNS.filter((c) => c.category === "courses");
  const progressCols = AVAILABLE_COLUMNS.filter((c) => c.category === "progress");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2D2B7A] via-[#3B3890] to-[#7D79F1] p-6 text-white flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <FileSpreadsheet className="text-emerald-400" size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-black flex items-center gap-2">
                تصدير بيانات الطلاب إلى Excel
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold">
                  .xlsx
                </span>
              </h2>
              <p className="text-sm text-purple-200 mt-0.5">
                قم بتخصيص الأعمدة وتصفية الطلاب وتنزيل تقرير إكسيل متكامل ومنسق
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Error Message */}
          {exportError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-3 animate-shake">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <span>{exportError}</span>
            </div>
          )}

          {/* Section 1: Scope Selection */}
          <div className="bg-[#F8F9FD] p-5 rounded-2xl border border-gray-100">
            <label className="text-sm font-extrabold text-[#2D2B7A] block mb-3 flex items-center gap-2">
              <Users size={18} className="text-[#7D79F1]" />
              نطاق الطلاب المراد تصديرهم
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  scope === "current"
                    ? "border-[#7D79F1] bg-[#7D79F1]/5 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "current"}
                  onChange={() => setScope("current")}
                  className="accent-[#7D79F1] w-4 h-4"
                />
                <div>
                  <span className="font-bold text-[#2D2B7A] text-sm block">الطلاب الظاهرون حالياً بالصفحة</span>
                  <span className="text-xs text-gray-500 font-medium">
                    (بعد تطبيق البحث والفلاتر الحالية - {currentFilteredStudents.length} طالب)
                  </span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  scope === "all"
                    ? "border-[#7D79F1] bg-[#7D79F1]/5 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                  className="accent-[#7D79F1] w-4 h-4"
                />
                <div>
                  <span className="font-bold text-[#2D2B7A] text-sm block">كل طلاب المنصة</span>
                  <span className="text-xs text-gray-500 font-medium">
                    (تصدير شامل لجميع الطلاب بقاعدة البيانات - {allStudents.length} طالب)
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 gap-6">
            <button
              onClick={() => setActiveTab("columns")}
              className={`pb-3 font-extrabold text-sm flex items-center gap-2 border-b-2 transition ${
                activeTab === "columns"
                  ? "border-[#7D79F1] text-[#7D79F1]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <Layers size={16} />
              اختيار الأعمدة ({selectedColumns.length})
            </button>
            <button
              onClick={() => setActiveTab("filters")}
              className={`pb-3 font-extrabold text-sm flex items-center gap-2 border-b-2 transition ${
                activeTab === "filters"
                  ? "border-[#7D79F1] text-[#7D79F1]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <Filter size={16} />
              تصفية متقدمة (الفلاتر)
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`pb-3 font-extrabold text-sm flex items-center gap-2 border-b-2 transition ${
                activeTab === "preview"
                  ? "border-[#7D79F1] text-[#7D79F1]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <Table size={16} />
              معاينة سريعة للبيانات
            </button>
          </div>

          {/* Tab 1: Columns Selection */}
          {activeTab === "columns" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-xl border">
                <span className="text-xs font-bold text-gray-600">إجراءات سريعة للأعمدة:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#7D79F1]/10 text-[#7D79F1] hover:bg-[#7D79F1]/20 transition"
                  >
                    تحديد الكل ({AVAILABLE_COLUMNS.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectBasicOnly}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
                  >
                    البيانات الأساسية فقط ({basicCols.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                  >
                    إلغاء تحديد الكل
                  </button>
                </div>
              </div>

              {/* Group 1: Basic Info */}
              <div>
                <h3 className="text-sm font-black text-[#2D2B7A] mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7D79F1]"></span>
                  البيانات الأساسية والشخصية
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {basicCols.map((col) => {
                    const isSelected = selectedColumns.includes(col.key);
                    return (
                      <div
                        key={col.key}
                        onClick={() => toggleColumn(col.key)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold cursor-pointer transition select-none ${
                          isSelected
                            ? "bg-[#7D79F1]/10 border-[#7D79F1] text-[#2D2B7A]"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare size={16} className="text-[#7D79F1] shrink-0" />
                        ) : (
                          <Square size={16} className="text-gray-300 shrink-0" />
                        )}
                        <span className="truncate">{col.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Courses */}
              <div>
                <h3 className="text-sm font-black text-[#2D2B7A] mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  بيانات الكورسات والاشتراكات
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {courseCols.map((col) => {
                    const isSelected = selectedColumns.includes(col.key);
                    return (
                      <div
                        key={col.key}
                        onClick={() => toggleColumn(col.key)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold cursor-pointer transition select-none ${
                          isSelected
                            ? "bg-blue-50 border-blue-400 text-blue-900"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare size={16} className="text-blue-600 shrink-0" />
                        ) : (
                          <Square size={16} className="text-gray-300 shrink-0" />
                        )}
                        <span className="truncate">{col.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group 3: Progress & Quizzes */}
              <div>
                <h3 className="text-sm font-black text-[#2D2B7A] mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  بيانات التقدم ونسب الاختبارات
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {progressCols.map((col) => {
                    const isSelected = selectedColumns.includes(col.key);
                    return (
                      <div
                        key={col.key}
                        onClick={() => toggleColumn(col.key)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold cursor-pointer transition select-none ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare size={16} className="text-emerald-600 shrink-0" />
                        ) : (
                          <Square size={16} className="text-gray-300 shrink-0" />
                        )}
                        <span className="truncate">{col.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Advanced Filters */}
          {activeTab === "filters" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                {/* Grade */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">الصف الدراسي</label>
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-[#7D79F1] bg-white"
                  >
                    <option value="">كل الصفوف الدراسية</option>
                    <option value="first">الصف الأول الثانوي</option>
                    <option value="second">الصف الثاني الثانوي</option>
                    <option value="third">الصف الثالث الثانوي</option>
                    <option value="prep3">الصف الثالث الإعدادي</option>
                  </select>
                </div>

                {/* Education System */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">النظام التعليمي</label>
                  <select
                    value={systemFilter}
                    onChange={(e) => setSystemFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-[#7D79F1] bg-white"
                  >
                    <option value="">كل الأنظمة</option>
                    <option value="general">عام</option>
                    <option value="azhar">أزهر</option>
                    <option value="general_baccalaureate">عام (بكالوريا)</option>
                    <option value="azhar_baccalaureate">أزهر (بكالوريا)</option>
                  </select>
                </div>

                {/* Track */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">الشعبة / المسار</label>
                  <select
                    value={trackFilter}
                    onChange={(e) => setTrackFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-[#7D79F1] bg-white"
                  >
                    <option value="">كل الشعب</option>
                    <option value="علمي علوم">علمي علوم</option>
                    <option value="علمي رياضة">علمي رياضة</option>
                    <option value="أدبي">أدبي</option>
                    <option value="عام">عام</option>
                  </select>
                </div>

                {/* Governorate */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">المحافظة</label>
                  <select
                    value={governorateFilter}
                    onChange={(e) => setGovernorateFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-[#7D79F1] bg-white"
                  >
                    <option value="">كل المحافظات</option>
                    {EGYPTIAN_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">النوع</label>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-[#7D79F1] bg-white"
                  >
                    <option value="">الكل (ذكور وإناث)</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>

                {/* Account Status */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">حالة الحساب</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-[#7D79F1] bg-white"
                  >
                    <option value="all">كل الحسابات</option>
                    <option value="approved">مفعل فقط</option>
                    <option value="pending">في انتظار التفعيل (معلق)</option>
                  </select>
                </div>

                {/* Enrolled Course */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">مشترك في كورس معين</label>
                  <select
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-[#7D79F1] bg-white"
                  >
                    <option value="">كل الكورسات</option>
                    {allCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">تاريخ التسجيل (من)</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-[#7D79F1] bg-white"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">تاريخ التسجيل (إلى)</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-[#7D79F1] bg-white"
                  />
                </div>

              </div>

              {/* Reset Filters Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setGradeFilter("");
                    setSystemFilter("");
                    setTrackFilter("");
                    setGovernorateFilter("");
                    setGenderFilter("");
                    setStatusFilter("all");
                    setCourseFilter("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 underline"
                >
                  إعادة ضبط جميع الفلاتر
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Data Preview */}
          {activeTab === "preview" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span>معاينة لأول {Math.min(previewStudents.length, 5)} طلاب حسب الأعمدة المختارة:</span>
                <span>إجمالي الطلاب المطابقين: {previewStudents.length}</span>
              </div>

              {previewStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed">
                  لا يوجد طلاب يطابقون خيارات الفلترة المحددة
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead className="bg-[#2D2B7A] text-white font-bold">
                      <tr>
                        {AVAILABLE_COLUMNS.filter((c) => selectedColumns.includes(c.key)).map((col) => (
                          <th key={col.key} className="p-3 border-l border-white/10 whitespace-nowrap">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700 bg-white">
                      {previewStudents.slice(0, 5).map((st) => (
                        <tr key={st.id} className="hover:bg-gray-50">
                          {AVAILABLE_COLUMNS.filter((c) => selectedColumns.includes(c.key)).map((col) => {
                            let val = st[col.key];
                            if (col.key === "grade") val = mapGradeToArabic(st.grade);
                            if (col.key === "education_system") val = mapEducationSystemToArabic(st.education_system, st.grade);
                            if (col.key === "is_approved") val = st.is_approved ? "مفعل" : "معلق";
                            if (col.key === "gender") val = st.gender === "male" ? "ذكر" : (st.gender === "female" ? "أنثى" : "غير محدد");
                            if (col.key === "created_at" && st.created_at) {
                              val = new Date(st.created_at).toLocaleDateString("ar-EG");
                            }

                            return (
                              <td key={col.key} className="p-3 whitespace-nowrap border-l border-gray-100 font-medium">
                                {val !== undefined && val !== null && val !== "" ? String(val) : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Live Summary Bar */}
          <div className="bg-gradient-to-r from-[#7D79F1]/15 to-purple-50 p-4 rounded-2xl border border-[#7D79F1]/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7D79F1] text-white flex items-center justify-center font-black">
                {previewStudents.length}
              </div>
              <div>
                <span className="text-xs font-bold text-gray-500 block">إجمالي الطلاب المحددين للتصدير</span>
                <span className="text-sm font-black text-[#2D2B7A]">
                  {previewStudents.length} طالب سيتم تضمينهم في ملف الـ Excel
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-[#2D2B7A]">
              <span className="bg-white px-3 py-1.5 rounded-xl border shadow-sm">
                الأعمدة المختارة: <strong className="text-[#7D79F1]">{selectedColumns.length}</strong> عمود
              </span>
              <span className="bg-white px-3 py-1.5 rounded-xl border shadow-sm">
                الصيغة: <strong className="text-emerald-600 font-black">Excel .xlsx</strong>
              </span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 p-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition text-sm"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || previewStudents.length === 0 || selectedColumns.length === 0}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#2D2B7A] to-[#7D79F1] text-white font-extrabold hover:shadow-lg hover:shadow-purple-500/25 transition disabled:opacity-50 flex items-center gap-2.5 text-sm shadow-md"
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>جاري إعداد وتحميل ملف Excel...</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>تصدير إلى Excel (.xlsx)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
