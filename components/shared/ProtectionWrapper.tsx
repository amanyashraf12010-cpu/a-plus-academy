"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ProtectionWrapper() {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Do not protect admin pages so admin can copy/right-click normally
    if (pathname?.startsWith("/admin")) {
      document.body.classList.remove("no-select");
      return;
    }

    // 2. Add selection protection class to body
    document.body.classList.add("no-select");

    // 3. Block keyboard shortcuts and right clicks
    const preventDefault = (e: Event) => e.preventDefault();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C (67), Ctrl+X (88), Ctrl+U (85), Ctrl+S (83)
      if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 88 || e.keyCode === 85 || e.keyCode === 83)) {
        e.preventDefault();
      }
      // Prevent F12 (123)
      if (e.keyCode === 123) {
        e.preventDefault();
      }
      // Prevent Ctrl+Shift+I (73), Ctrl+Shift+C (67), Ctrl+Shift+J (74)
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 67 || e.keyCode === 74)) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("copy", preventDefault);
    document.addEventListener("cut", preventDefault);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("copy", preventDefault);
      document.removeEventListener("cut", preventDefault);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname]);

  return null;
}
