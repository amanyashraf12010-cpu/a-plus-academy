"use client";
import { useParams } from "next/navigation";


import { useState } from "react";

import StudentInfo from "@/components/checkout/StudentInfo";
import PaymentMethod from "@/components/checkout/PaymentMethod";
import CheckoutButton from "@/components/checkout/CheckoutButton";
import CourseSummary from "@/components/checkout/CourseSummary";

export default function CheckoutPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("vodafone");

  const params = useParams<{ id: string }>();
  const id = params.id;
  const [errors, setErrors] = useState({
  name: "",
  phone: "",
});

const validate = () => {
  const newErrors = {
    name: "",
    phone: "",
  };

  let isValid = true;

  if (!name.trim()) {
    newErrors.name = "من فضلك أدخل اسمك بالكامل";
    isValid = false;
  }

  if (!phone.trim()) {
    newErrors.phone = "من فضلك أدخل رقم الهاتف";
    isValid = false;
  } else if (!/^01[0125][0-9]{8}$/.test(phone)) {
    newErrors.phone = "رقم الهاتف غير صحيح";
    isValid = false;
  }

  setErrors(newErrors);

  return isValid;
};



const course = {
  id,
  title: "اسم الكورس",
  teacher: "اسم المدرس",
  price: 350,
  image: "/111.png",
};

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-black">

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-10">
        <div className="rounded-3xl bg-gradient-to-r from-[#7D79F1] to-[#5E5AEF] text-white p-8 md:p-10 shadow-lg">

          <h1 className="text-3xl md:text-4xl font-bold">
            💳 إتمام الاشتراك
          </h1>

          <p className="mt-3 text-white/90">
            أكمل بياناتك واختر طريقة الدفع لإتمام الاشتراك.
          </p>

        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-16">

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Side */}
          <div className="lg:col-span-2 space-y-6">

            <StudentInfo
  name={name}
  phone={phone}
  setName={setName}
  setPhone={setPhone}
  errors={errors}
/>

            <PaymentMethod
              method={method}
              setMethod={setMethod}
            />

            <CheckoutButton
  course={course}
  name={name}
  phone={phone}
  method={method}
  validate={validate}
/>

          </div>

          {/* Right Side */}
          <div>
            <CourseSummary course={course} />
          </div>

        </div>

      </div>

    </div>
  );
}