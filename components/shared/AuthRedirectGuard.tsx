"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthRedirectGuard() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkHashAndParams = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const pathname = window.location.pathname;
      
      const hasOtpExpired = 
        hash.includes("otp_expired") || 
        search.includes("otp_expired") ||
        hash.includes("access_denied") ||
        search.includes("access_denied") ||
        hash.includes("Email+link+is+invalid");

      if (hasOtpExpired) {
        // Redirect to forgot-password with expired error query
        router.push("/forgot-password?error=expired");
        return;
      }

      // If this is a recovery redirect (reset password link clicked) but user is not on the reset page yet
      const isRecovery = hash.includes("type=recovery") || search.includes("type=recovery");
      if (isRecovery && pathname !== "/reset-password") {
        router.replace(`/reset-password${search}${hash}`);
      }
    };

    checkHashAndParams();

    // Check again if hash changes
    window.addEventListener("hashchange", checkHashAndParams);
    return () => {
      window.removeEventListener("hashchange", checkHashAndParams);
    };
  }, [router]);

  return null;
}
