"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ProtectionWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

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

  // 4. Single session limit check
  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, current_session_id")
          .eq("id", user.id)
          .single();

        if (error || !profile) return;

        // Apply session limit only to students (admins can open multiple tabs/sessions safely)
        if (profile.role !== "student") return;

        const localSessionId = localStorage.getItem("active_session_id");

        // Set database session ID if it is missing
        if (!profile.current_session_id) {
          const fallbackSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem("active_session_id", fallbackSessionId);
          await supabase
            .from("profiles")
            .update({ current_session_id: fallbackSessionId })
            .eq("id", user.id);
          return;
        }

        // Trigger log out if local ID doesn't match database ID
        if (localSessionId && localSessionId !== profile.current_session_id) {
          await supabase.auth.signOut();
          localStorage.removeItem("active_session_id");
          alert("تنبيه أمني: تم تسجيل الخروج لأن حسابك مفتوح حالياً من جهاز آخر 🔐");
          router.push("/login");
        } else if (!localSessionId) {
          // Sync local storage if it was cleared but database is active
          localStorage.setItem("active_session_id", profile.current_session_id);
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    }

    checkSession();
  }, [pathname, router, supabase]);

  return null;
}
