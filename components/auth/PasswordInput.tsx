"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  label: string;
  placeholder: string;
  value?: string;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PasswordInput({
  label,
  placeholder,
  value,
  error,
  onChange,
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-[#02343F]">
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`
            w-full
            rounded-2xl
            px-4
            py-4
            pr-4
            text-[#2D2B7A]
            outline-none
            transition
            placeholder:text-gray-400
            ${
              error
                ? "border-2 border-red-500 focus:ring-2 focus:ring-red-200"
                : "border border-gray-200 bg-[#FAFAFF] focus:border-[#7D79F1] focus:ring-4 focus:ring-[#7D79F1]/20"
            }
          `}
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#7D79F1]"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}