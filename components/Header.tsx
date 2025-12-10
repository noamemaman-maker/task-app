import Link from "next/link";
import { UserCircle } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-[hsl(30,15%,20%)] text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href={"/"} className="text-xl font-bold text-white hover:text-white/90">
          Task App
        </Link>

        <Link href="/profile" className="text-white hover:text-white/90">
          <UserCircle className="w-6 h-6" />
        </Link>
      </div>
    </header>
  );
};

export default Header;
