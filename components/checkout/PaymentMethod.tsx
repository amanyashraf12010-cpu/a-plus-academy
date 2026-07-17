"use client";
import { Smartphone, CreditCard } from "lucide-react";

import PaymentDetails from "./PaymentDetails";

export default function PaymentMethod({
  method,
  setMethod,
}: any) {
  return (
    <>
      <div className="bg-white rounded-3xl p-6 shadow-sm border">

        <h2 className="text-xl font-bold text-[#2D2B7A] mb-6">
          طريقة الدفع
        </h2>

        <div className="space-y-4">

          {/* Vodafone Cash */}
          <label
  className={`rounded-2xl border p-5 cursor-pointer transition block ${
    method === "vodafone"
      ? "border-[#7D79F1] bg-[#F5F3FF]"
      : "border-gray-200 hover:border-[#7D79F1]"
  }`}
>

<div className="flex justify-between items-center">

<div className="flex gap-3 items-center">

<Smartphone
size={24}
className="text-[#7D79F1]"
/>

<div>

<p className="font-bold text-[#2D2B7A]">
Vodafone Cash
</p>

<p className="text-sm text-gray-500">
الدفع عبر فودافون كاش
</p>

</div>

</div>

<input
type="radio"
checked={method==="vodafone"}
onChange={()=>setMethod("vodafone")}
className="accent-[#7D79F1]"
/>

</div>

</label>

          {/* InstaPay */}
          <label
  className={`rounded-2xl border p-5 cursor-pointer transition block ${
    method === "instapay"
      ? "border-[#7D79F1] bg-[#F5F3FF]"
      : "border-gray-200 hover:border-[#7D79F1]"
  }`}
>

<div className="flex justify-between items-center">

<div className="flex gap-3 items-center">

<CreditCard
size={24}
className="text-[#7D79F1]"
/>

<div>

<p className="font-bold text-[#2D2B7A]">
InstaPay
</p>

<p className="text-sm text-gray-500">
الدفع عبر InstaPay
</p>

</div>

</div>

<input
type="radio"
checked={method==="instapay"}
onChange={()=>setMethod("instapay")}
className="accent-[#7D79F1]"
/>

</div>

</label>

        </div>

      </div>

      <PaymentDetails method={method} />

    </>
  );
}