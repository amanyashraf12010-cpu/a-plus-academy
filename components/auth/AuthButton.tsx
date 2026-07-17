interface Props {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export default function AuthButton({
  children,
  type = "button",
  disabled = false,
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="
        w-full
        rounded-2xl
        bg-[#7D79F1]
        py-4
        text-lg
        font-bold
        text-white
        transition-all
        duration-300
        hover:-translate-y-1
        hover:bg-[#6B66E8]
        hover:shadow-[0_15px_40px_rgba(125,121,241,.4)]
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      {children}
    </button>
  );
}