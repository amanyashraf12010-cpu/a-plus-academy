interface AuthInputProps {
  label: string;
  type?: string;
  placeholder: string;
  value?: string;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AuthInput({
  label,
  type = "text",
  placeholder,
  value,
  error,
  onChange,
}: AuthInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-[#02343F]">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
       className={`
  w-full
  rounded-2xl
  px-4 py-3
  text-[#2D2B7A]
  outline-none
  transition
  placeholder:text-gray-400
  ${
    error
      ? "border-2 border-red-500 focus:ring-2 focus:ring-red-200"
      : "border border-gray-200 focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20"
  }
`}
      />

      {error && (
        <p className="text-sm text-red-500 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}