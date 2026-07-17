import Link from "next/link";
import Image from "next/image";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      
      
      <Image
        src="/logo.png"
        alt="A Plus Academy Logo"
        width={100}
        height={100}
        className="rounded-md"
      />

      

    </Link>
  );
}