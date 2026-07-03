"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar({ locale, session: serverSession }: { locale: string; session: unknown }) {
  const { data: clientSession } = useSession();
  const session = clientSession ?? serverSession;
  const user = (session as { user?: { name?: string; image?: string } } | null)?.user;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-border/50 bg-neutral-950/30">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 text-white font-bold text-sm">
          🛡️ Comply
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-4 text-xs">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-muted hover:text-white transition-colors"
              >
                {user.image ? (
                  <img src={user.image} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {user.name?.charAt(0) ?? "U"}
                  </div>
                )}
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-border bg-neutral-900 shadow-lg py-1">
                    <div className="px-3 py-2 border-b border-border/50">
                      <p className="text-xs text-white font-medium truncate">{user.name}</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-3 py-2 text-xs text-muted hover:text-white hover:bg-neutral-800 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="text-muted hover:text-white transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
