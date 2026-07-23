"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Logo from "./Logo";
import NavLinks from "./NavLinks";
import AuthButtons from "./AuthButtons";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then((res: any) => {
      setUser(res.data?.session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hide navbar on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 w-full bg-white border-b border-gray-100 z-50">
      <div className="flex flex-row-reverse items-center justify-between h-20 px-6">

         {/* LEFT - AUTH BUTTONS */}
        <div className="hidden md:flex">
          {!loading && <AuthButtons user={user} />}
        </div>
       

        {/* CENTER - LINKS */}
        <div className="hidden md:flex flex-1 justify-center">
          <NavLinks user={user} />
        </div>

       
         {/* RIGHT - LOGO */}
        <div className="flex items-center -gap-10">
          <Logo />
        </div>

        {/* MOBILE */}
        <div className="md:hidden">
          {!loading && <MobileMenu user={user} />}
        </div>

      </div>
    </header>
  );
}