"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
        <span>🏡</span>
        <span>Family Hub</span>
      </Link>
      {session?.user && (
        <div className="flex items-center gap-3">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "User"}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <span className="text-sm text-gray-600 hidden sm:block">{session.user.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
