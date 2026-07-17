"use client";
import { Copy } from "lucide-react";

export default function PaymentDetails({ method }: any) {
  const paymentNumber = "+201014257625";
  const instaPay = "@APlusAcademy";

  const copyText = () => {
    navigator.clipboard.writeText(
      method === "vodafone" ? paymentNumber : instaPay
    );

    alert("تم النسخ ✅");
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border">

      <h2 className="text-xl font-bold text-[#2D2B7A] mb-5">
        بيانات الدفع
      </h2>

      <div className="rounded-2xl bg-[#F8F9FD] p-5 border">

        <p className="text-gray-500 mb-2">
          {method === "vodafone"
            ? "رقم Vodafone Cash"
            : "حساب InstaPay"}
        </p>

        <div className="flex justify-between items-center">

          <span className="font-bold text-lg text-[#7D79F1]">

            {method === "vodafone"
              ? paymentNumber
              : instaPay}

          </span>

         <button
onClick={copyText}
className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#7D79F1] text-white hover:bg-[#6965e6] transition"
>

<Copy size={18}/>

نسخ

</button>

        </div>

      </div>

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