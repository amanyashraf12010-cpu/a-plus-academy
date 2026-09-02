"use client";

import { useEffect, useState } from "react";
import { 
  getAssistantsList, 
  createAssistantAccount, 
  deleteAssistantAccount, 
  updateAssistantTeacher 
} from "@/lib/assistant";
import { getTeachers } from "@/lib/admin";
import { Plus, Trash2, Edit2, UserCheck, Mail, Lock, GraduationCap, X, Check, Loader2 } from "lucide-react";

export default function AdminAssistantsPage() {
  const [assistants, setAssistants] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit Teacher Modal
  const [editingAssistant, setEditingAssistant] = useState<any | null>(null);
  const [editTeacherId, setEditTeacherId] = useState("");
  const [updating, setUpdating] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [assistantsData, teachersData] = await Promise.all([
        getAssistantsList(),
        getTeachers(),
      ]);
      setAssistants(assistantsData || []);
      setTeachers(teachersData || []);
      if (teachersData && teachersData.length > 0 && !teacherId) {
        setTeacherId(teachersData[0].id);
      }
    } catch (err: any) {
      console.error("فشل تحميل البيانات:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateAssistant(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !teacherId) {
      alert("يرجى ملء جميع الحقول المطلوبة واختيار المدرس المسؤول.");
      return;
    }

    try {
      setSaving(true);
      await createAssistantAccount({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        teacher_id: teacherId,
      });

      alert("تم إنشاء حساب المساعدة بنجاح 🎉");
      setShowAddModal(false);
      setName("");
      setEmail("");
      setPassword("");
      loadData();
    } catch (err: any) {
      alert("فشل إنشاء حساب المساعدة: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف حساب المساعدة (${name}) نهائياً؟`)) return;
    try {
      await deleteAssistantAccount(id);
      alert("تم حذف حساب المساعدة بنجاح.");
      loadData();
    } catch (err: any) {
      alert("فشل الحذف: " + err.message);
    }
  }

  async function handleUpdateTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAssistant || !editTeacherId) return;
    try {
      setUpdating(true);
      await updateAssistantTeacher(editingAssistant.id, editTeacherId);
      alert("تم تغيير المدرس المسؤول للمساعدة بنجاح.");
      setEditingAssistant(null);
      loadData();
    } catch (err: any) {
      alert("فشل التحديث: " + err.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2D2B7A] flex items-center gap-3">
            <UserCheck className="text-[#7D79F1]" size={32} />
            إدارة مساعدات المدرسين
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-semibold">
            إنشاء وإدارة حسابات المساعدات وربط كل مساعدة بالمدرس الخاص بها
          </p>
        </div>

        <button
          onClick={() => {
            if (teachers.length === 0) {
              alert("يجب إضافة مدرس واحد على الأقل أولاً قبل إنشاء حساب مساعدة.");
              return;
            }
            setShowAddModal(true);
          }}
          className="bg-[#7D79F1] hover:bg-[#655EF0] text-white px-5 py-3 rounded-2xl transition font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#7D79F1]/20 cursor-pointer"
        >
          <Plus size={20} />
          إضافة مساعدة جديدة
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border">
          <Loader2 className="animate-spin text-[#7D79F1] mx-auto mb-3" size={36} />
          <p className="text-gray-500 font-bold">جاري تحميل قائمة المساعدات...</p>
        </div>
      ) : assistants.length === 0 ? (
        <div className="bg-white rounded-3xl border p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F3F2FF] text-[#7D79F1] flex items-center justify-center mx-auto">
            <UserCheck size={32} />
          </div>
          <h3 className="text-xl font-bold text-[#2D2B7A]">لا توجد مساعدات مسجلات حالياً</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            اضغط على زر "إضافة مساعدة جديدة" لإنشاء أول حساب مساعدة وربطه بمدرس محدد لمتابعة الكورسات والطلاب.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-[#F5F7FB] border-b text-[#2D2B7A] font-bold">
                <tr>
                  <th className="p-4">اسم المساعدة</th>
                  <th className="p-4">البريد الإلكتروني</th>
                  <th className="p-4">المدرس المسؤول</th>
                  <th className="p-4">تاريخ الإنشاء</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {assistants.map((ast) => (
                  <tr key={ast.id} className="hover:bg-[#F3F2FF]/20 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F3F2FF] text-[#7D79F1] font-extrabold flex items-center justify-center">
                          {ast.full_name?.charAt(0) || "م"}
                        </div>
                        <div>
                          <span className="font-bold text-[#2D2B7A] block">{ast.full_name}</span>
                          <span className="text-[11px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                            مساعدة نشطة
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-600 dir-ltr text-right">
                      {ast.email || "-"}
                    </td>
                    <td className="p-4">
                      {ast.teachers ? (
                        <div className="inline-flex items-center gap-2 bg-purple-50 text-[#7D79F1] px-3 py-1.5 rounded-xl border border-purple-100 font-bold text-xs">
                          <GraduationCap size={14} />
                          <span>{ast.teachers.name} ({ast.teachers.subject})</span>
                        </div>
                      ) : (
                        <span className="text-red-500 font-bold text-xs">غير محدد</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-gray-400">
                      {new Date(ast.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingAssistant(ast);
                            setEditTeacherId(ast.teacher_id || (teachers[0]?.id ?? ""));
                          }}
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                          title="تغيير المدرس المسؤول"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ast.id, ast.full_name)}
                          className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                          title="حذف حساب المساعدة"
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
        </div>
      )}

      {/* CREATE ASSISTANT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-extrabold text-[#2D2B7A] flex items-center gap-2">
                ➕ إضافة مساعدة مدرس جديدة
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAssistant} className="p-6 space-y-4">
              
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">اسم المساعدة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سارة أحمد"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Mail size={14} /> البريد الإلكتروني لتسجيل الدخول *
                </label>
                <input
                  type="email"
                  required
                  placeholder="assistant@aplus.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium dir-ltr text-right"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Lock size={14} /> كلمة المرور *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium dir-ltr text-right"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Teacher Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <GraduationCap size={14} /> اختيار المدرس المسؤول *
                </label>
                <select
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-bold bg-white cursor-pointer focus:border-[#7D79F1]"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subject})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  المساعدة ستتمكن فقط من متابعة وإدارة كورسات وطلاب هذا المدرس.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3.5 bg-[#7D79F1] hover:bg-[#655EF0] disabled:bg-gray-300 text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  إنشاء حساب المساعدة
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-bold transition text-xs border cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT TEACHER MODAL */}
      {editingAssistant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-extrabold text-[#2D2B7A]">
                📝 تعديل المدرس المسؤول
              </h2>
              <button
                onClick={() => setEditingAssistant(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateTeacher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">اسم المساعدة</label>
                <p className="font-bold text-[#2D2B7A] text-sm bg-gray-50 p-3 rounded-xl border">
                  {editingAssistant.full_name}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">المدرس المسؤول الجديد</label>
                <select
                  value={editTeacherId}
                  onChange={(e) => setEditTeacherId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-[#2D2B7A] font-bold bg-white cursor-pointer focus:border-[#7D79F1]"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 bg-[#7D79F1] hover:bg-[#655EF0] disabled:bg-gray-300 text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {updating ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  حفظ التعديل
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAssistant(null)}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-bold transition text-xs border cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
