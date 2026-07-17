import Logo from "./Logo";
import NavLinks from "./NavLinks";
import AuthButtons from "./AuthButtons";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  return (
    <header className="sticky top-0 w-full bg-white border-b border-gray-100 z-50">
      <div className="flex flex-row-reverse items-center justify-between h-20 px-6">

         {/* LEFT - AUTH BUTTONS */}
        <div className="hidden md:flex">
          <AuthButtons />
        </div>
       

        {/* CENTER - LINKS */}
        <div className="hidden md:flex flex-1 justify-center">
          <NavLinks />
        </div>

       
         {/* RIGHT - LOGO */}
        <div className="flex items-center -gap-10">
          <Logo />
        </div>

        {/* MOBILE */}
        <div className="md:hidden">
          <MobileMenu />
        </div>

      </div>
    </header>
  );
}