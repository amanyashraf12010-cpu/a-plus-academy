"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileActions from "@/components/profile/ProfileActions";
import { X, Phone, GraduationCap, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Edit form states
  const [editPhone, setEditPhone] = useState("");
  const [editSchool, setEditSchool] = useState("");
  const [editParentPhone, setEditParentPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const supabase = createClient();

  async function loadProfile() {
    try {
      setLoading(true);
      setErrorMsg("");
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const { count } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "approved");

      const mapped = {
        name: profileData.full_name,
        email: profileData.email || user.email,
        phone: profileData.phone,
        courses: count || 0,
        grade: profileData.grade || "غير محدد",
        education_system: profileData.education_system === "general" ? "ثانوي عام" : "ثانوي أزهر",
        track: profileData.track || "غير محدد",
        school: profileData.school || "غير محدد",
        governorate: profileData.governorate || "غير محدد",
        parent_phone: profileData.parent_phone || "غير محدد",
        parent_job: profileData.parent_job || "غير محدد"
      };

      setProfile(mapped);
      
      // Pre-populate edit states
      setEditPhone(profileData.phone || "");
      setEditSchool(profileData.school || "");
      setEditParentPhone(profileData.parent_phone || "");
    } catch (error) {
      console.error("فشل تحميل بيانات الملف الشخصي:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const phoneRegex = /^01[0125][0-9]{8}$/;

    // 1. Validation
    if (!editPhone.trim() || !editSchool.trim() || !editParentPhone.trim()) {
      setErrorMsg("الرجاء ملء جميع الحقول المطلوبة.");
      return;
    }

    if (!phoneRegex.test(editPhone)) {
      setErrorMsg("رقم هاتف الطالب غير صحيح.");
      return;
    }

    if (!phoneRegex.test(editParentPhone)) {
      setErrorMsg("رقم هاتف ولي الأمر غير صحيح.");
      return;
    }

    if (editPhone.trim() === editParentPhone.trim()) {
      setErrorMsg("رقم هاتف الطالب يجب أن يكون مختلفاً تماماً عن رقم ولي الأمر.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          phone: editPhone.trim(),
          school: editSchool.trim(),
          parent_phone: editParentPhone.trim()
        })
        .eq("id", userId);

      if (error) throw error;

      alert("تم تحديث بيانات ملفك الشخصي بنجاح! 🎉");
      setShowEditModal(false);
      loadProfile();
    } catch (error: any) {
      setErrorMsg(error.message || "حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]" dir="rtl">
        <div className="text-[#2D2B7A] font-bold text-lg">جاري تحميل بيانات حسابك...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]" dir="rtl">
        <div className="text-red-500 font-bold text-lg">فشل تحميل الملف الشخصي.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD]" dir="rtl">
      
      {/* Title */}
      <div className="text-center py-10">
        <h1 className="text-4xl font-extrabold text-[#2D2B7A]">
          👤 الملف الشخصي
        </h1>
        <p className="text-gray-500 mt-2">
          إدارة واستعراض بيانات حسابك الدراسي
        </p>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 pb-16 space-y-6">
        
        <ProfileHeader profile={profile} />

        <ProfileStats profile={profile} />

        <ProfileActions onEdit={() => setShowEditModal(true)} />

      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-extrabold text-[#2D2B7A]">
                📝 تعديل بياناتي
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1">
                  <Phone size={12} /> رقم هاتف الطالب *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              {/* School */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1">
                  <GraduationCap size={12} /> المدرسة *
                </label>
                <input
                  type="text"
                  required
                  placeholder="اكتب اسم مدرستك"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
                  value={editSchool}
                  onChange={(e) => setEditSchool(e.target.value)}
                />
              </div>

              {/* Parent Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1">
                  <Phone size={12} /> رقم هاتف ولي الأمر *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20 outline-none text-[#2D2B7A] transition font-medium"
                  value={editParentPhone}
                  onChange={(e) => setEditParentPhone(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 px-4 bg-[#7D79F1] hover:bg-[#655EF0] disabled:bg-gray-300 text-white rounded-xl font-bold transition text-sm shadow-md"
                >
                  {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-bold transition text-sm border"
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