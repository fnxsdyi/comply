"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
] as const;

const DEFAULT_LOCALE = "en";

function getTargetPath(currentPath: string, currentLocale: string, targetLocale: string): string {
  // Strip current locale prefix if present
  let base = currentPath;
  if (currentLocale !== DEFAULT_LOCALE) {
    base = currentPath.replace(`/${currentLocale}`, "") || "/";
  }
  // Add target locale prefix (skip for default)
  if (targetLocale === DEFAULT_LOCALE) {
    return base;
  }
  return `/${targetLocale}${base === "/" ? "" : base}`;
}

export default function Navbar({ locale, session: serverSession }: { locale: string; session: unknown }) {
  const { data: clientSession } = useSession();
  const session = clientSession ?? serverSession;
  const user = (session as { user?: { name?: string; image?: string } } | null)?.user;
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const pathname = usePathname();

  const currentLang = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  return (
    <nav className="border-b border-border/50 bg-neutral-950/30">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 text-white font-bold text-sm">
          🛡️ Comply
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-4 text-xs">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 text-muted hover:text-white transition-colors px-2 py-1 rounded hover:bg-neutral-800"
            >
              🌐 {currentLang.label}
              <svg className={"w-3 h-3 transition-transform " + (langOpen ? "rotate-180" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {langOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-border bg-neutral-900 shadow-lg py-1 max-h-64 overflow-y-auto">
                  {LANGUAGES.map((lang) => (
                    <Link
                      key={lang.code}
                      href={getTargetPath(pathname, locale, lang.code)}
                      onClick={() => setLangOpen(false)}
                      className={`block px-3 py-2 text-xs transition-colors ${
                        lang.code === locale
                          ? "text-white bg-neutral-800 font-medium"
                          : "text-muted hover:text-white hover:bg-neutral-800"
                      }`}
                    >
                      {lang.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

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
