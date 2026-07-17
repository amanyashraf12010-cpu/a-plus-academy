"use client";

import { useState } from "react";
import Link from "next/link";
import { navLinks } from "@/constants/navLinks";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Burger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="text-3xl text-[#02343F]"
      >
        ☰
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 right-0 h-full w-64 bg-white z-50 shadow-lg
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="p-5 flex flex-col gap-6">
          
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            className="text-left text-2xl"
          >
            ✕
          </button>

          {/* Links */}
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-lg font-medium text-[#02343F] hover:text-[#7D79F1]"
              >
                {link.label}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}