"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AuthRedirectGuard() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Listen to Supabase Auth State Changes for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === "PASSWORD_RECOVERY") {
        router.push("/reset-password");
      }
    });

    // 2. Fallback check for expired OTP links in hash/search
    const checkHashAndParams = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      
      const hasOtpExpired = 
        hash.includes("otp_expired") || 
        search.includes("otp_expired") ||
        hash.includes("access_denied") ||
        search.includes("access_denied") ||
        hash.includes("Email+link+is+invalid");

      if (hasOtpExpired) {
        router.push("/forgot-password?error=expired");
      }
    };

    checkHashAndParams();

    window.addEventListener("hashchange", checkHashAndParams);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("hashchange", checkHashAndParams);
    };
  }, [router, supabase]);

  return null;
}
