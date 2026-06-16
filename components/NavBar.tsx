"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-[#fffdf9] border-b border-[#e5ddd5] px-6 py-4 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-[#3d2f27] text-lg">
        <span>🏡</span>
        <span>Family <span className="text-[#c17a5a]">Hub</span></span>
      </Link>
      {session?.user && (
        <div className="flex items-center gap-3">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "User"}
              width={32}
              height={32}
              className="rounded-full ring-2 ring-[#e5ddd5]"
            />
          )}
          <span className="text-sm text-[#7a6a62] hidden sm:block">{session.user.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-[#9c8e82] hover:text-[#3d2f27] transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
