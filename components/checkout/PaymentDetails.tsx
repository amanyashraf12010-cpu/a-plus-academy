"use client";
import { Copy } from "lucide-react";

export default function PaymentDetails({ method }: any) {
  const paymentNumber = "01014257625";
  const instaPayUser = "aplus690@instapay";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("تم النسخ ✅");
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border">
      <h2 className="text-xl font-bold text-[#2D2B7A] mb-5">
        بيانات الدفع
      </h2>

      {method === "vodafone" ? (
        <div className="rounded-2xl bg-[#F8F9FD] p-5 border">
          <p className="text-gray-500 mb-2">رقم Vodafone Cash</p>
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg text-[#7D79F1]">
              {paymentNumber}
            </span>
            <button
              onClick={() => copyToClipboard(paymentNumber)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#7D79F1] text-white hover:bg-[#6965e6] transition cursor-pointer"
            >
              <Copy size={18} />
              نسخ
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#F8F9FD] p-5 border">
            <p className="text-gray-500 mb-2">عنوان / اسم مستخدم InstaPay</p>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg text-[#7D79F1] select-all">
                {instaPayUser}
              </span>
              <button
                onClick={() => copyToClipboard(instaPayUser)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#7D79F1] text-white hover:bg-[#6965e6] transition cursor-pointer"
              >
                <Copy size={18} />
                نسخ
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-[#F8F9FD] p-5 border">
            <p className="text-gray-500 mb-2">رقم هاتف InstaPay</p>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg text-[#7D79F1]">
                {paymentNumber}
              </span>
              <button
                onClick={() => copyToClipboard(paymentNumber)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#7D79F1] text-white hover:bg-[#6965e6] transition cursor-pointer"
              >
                <Copy size={18} />
                نسخ
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500 mt-5 leading-7">
        بعد إتمام التحويل اضغط على زر
        <span className="font-semibold text-[#2D2B7A]">
          {" "}
          فتح واتساب وإرسال الإيصال
        </span>
        ، وسيتم فتح محادثة واتساب برسالة جاهزة، ثم قم بإرسال صورة الإيصال.
      </p>
    </div>
  );
}