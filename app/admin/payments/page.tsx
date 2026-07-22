"use client";

import { useEffect, useState } from "react";
import { getPendingSubscriptions, approveSubscription, rejectSubscription, getReceiptSignedUrl } from "@/lib/admin";
import { CreditCard, Check, X, Eye, RefreshCw } from "lucide-react";

export default function AdminPaymentsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function loadSubscriptions() {
    try {
      setLoading(true);
      const data = await getPendingSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error("فشل تحميل الاشتراكات المعلقة:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function handleViewReceipt(sub: any) {
    try {
      setSelectedSub(sub);
      setVerifying(true);
      if (!sub.receipt_url) {
        setReceiptUrl("whatsapp");
        return;
      }
      const url = await getReceiptSignedUrl(sub.receipt_url);
      setReceiptUrl(url);
    } catch (error) {
      console.error(error);
      alert("فشل تحميل صورة الإيصال.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleApprove(id: string) {
    if (!confirm("هل أنت متأكد من تفعيل هذا الاشتراك؟ سيتم تفعيل وصول الطالب للكورس مباشرة.")) return;
    try {
      await approveSubscription(id);
      alert("تم تفعيل الكورس للطالب بنجاح.");
      setReceiptUrl(null);
      setSelectedSub(null);
      loadSubscriptions();
    } catch (error: any) {
      alert("فشل التفعيل: " + error.message);
    }
  }

  async function handleReject(id: string) {
    if (!confirm("هل أنت متأكد من رفض هذا الاشتراك؟")) return;
    try {
      await rejectSubscription(id);
      alert("تم رفض الاشتراك.");
      setReceiptUrl(null);
      setSelectedSub(null);
      loadSubscriptions();
    } catch (error: any) {
      alert("فشل الرفض: " + error.message);
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2D2B7A]">💳 تأكيد المدفوعات</h1>
          <p className="text-gray-500 mt-2">مراجعة وتفعيل اشتراكات الطلاب المعلقة وتأكيد إيصالات الدفع</p>
        </div>
        <button
          onClick={loadSubscriptions}
          className="p-3 rounded-xl bg-white border hover:bg-gray-50 text-[#2D2B7A] transition flex items-center gap-2 font-semibold"
        >
          <RefreshCw size={18} />
          تحديث البيانات
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Subscriptions Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 font-bold">جاري تحميل المدفوعات المعلقة...</div>
          ) : subscriptions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-bold">لا توجد اشتراكات في انتظار التفعيل حالياً.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-[#F5F7FB] border-b text-[#2D2B7A] font-bold">
                  <tr>
                    <th className="p-4">الطالب</th>
                    <th className="p-4">الكورس المطلوب</th>
                    <th className="p-4">طريقة الدفع</th>
                    <th className="p-4 text-center">تفاصيل</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[#F3F2FF]/30 transition">
                      <td className="p-4 font-bold text-[#2D2B7A]">
                        <div>
                          {sub.profiles?.full_name}
                          <span className="block text-xs text-gray-400 font-normal">{sub.profiles?.phone}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-semibold">{sub.courses?.title}</td>
                      <td className="p-4 text-sm font-semibold">
                        <span className="px-2 py-1 bg-purple-50 text-[#7D79F1] border border-purple-200 rounded-lg text-xs">
                          {sub.payment_method === "vodafone_cash" ? "فودافون كاش" : "انستا باي"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleViewReceipt(sub)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition text-xs font-bold flex items-center gap-1.5 mx-auto"
                        >
                          <Eye size={14} />
                          عرض الإيصال
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(sub.id)}
                            title="تفعيل وتأكيد الدفع"
                            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(sub.id)}
                            title="رفض الطلب"
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                          >
                            <X size={16} />
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

        {/* View Receipt Sidebar */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between min-h-[400px]">
          <div>
            <h2 className="text-xl font-extrabold text-[#2D2B7A] border-b pb-4 mb-4">🔍 إيصال الدفع</h2>
            
            {verifying ? (
              <div className="text-center py-12 text-gray-400 text-sm">جاري جلب إيصال الدفع بأمان...</div>
            ) : receiptUrl && selectedSub ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border space-y-2">
                  <p><strong>الطالب:</strong> {selectedSub.profiles?.full_name}</p>
                  <p><strong>الكورس:</strong> {selectedSub.courses?.title}</p>
                  <p><strong>سعر الكورس:</strong> {selectedSub.courses?.price} جنيه</p>
                  <p><strong>طريقة التحويل:</strong> {selectedSub.payment_method === "vodafone_cash" ? "فودافون كاش" : "انستا باي"}</p>
                </div>
                
                {receiptUrl === "whatsapp" ? (
                  <div className="border border-amber-200 rounded-xl bg-amber-50 p-6 flex flex-col items-center justify-center text-center text-amber-800 text-sm gap-2 h-64">
                    <span className="text-2xl">📱</span>
                    <p className="font-bold">الإيصال مرسل على الواتساب</p>
                    <p className="text-xs text-amber-600">
                      قام الطالب بفتح الواتساب لإرسال الإيصال للأكاديمية يدوياً.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-hidden bg-black flex items-center justify-center h-64">
                    <img
                      src={receiptUrl}
                      alt="Receipt Screenshot"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(selectedSub.id)}
                    className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition text-xs"
                  >
                    تأكيد وقبول الاشتراك
                  </button>
                  <button
                    onClick={() => handleReject(selectedSub.id)}
                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition text-xs"
                  >
                    رفض الاشتراك
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm flex flex-col items-center justify-center gap-2">
                <CreditCard size={32} className="text-gray-300" />
                <span>اضغط على "عرض الإيصال" لأي طالب لمراجعة إثبات الدفع هنا وتفعيله.</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
