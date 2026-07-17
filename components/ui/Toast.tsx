"use client";

export default function Toast({ message }: any) {
  if (!message) return null;

  return (
    <div className="fixed top-5 right-5 bg-[#7D79F1] text-white px-4 py-3 rounded-xl shadow-lg animate-bounce">
      {message}
    </div>
  );
}