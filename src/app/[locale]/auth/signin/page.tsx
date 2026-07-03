"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState<string | null>(null);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">🛡️</div>
          <h1 className="text-2xl font-bold text-white">Sign in to Comply</h1>
          <p className="text-sm text-muted">
            Track your scans, unlock Pro features, and more.
          </p>
        </div>

        <div className="space-y-3">
          {/* GitHub */}
          <button
            onClick={() => {
              setLoading("github");
              signIn("github", { callbackUrl: "/" });
            }}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading === "github" ? (
              <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            )}
            Continue with GitHub
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted">or</span>
            </div>
          </div>

          {/* Email */}
          <button
            disabled={true}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-neutral-900/50 px-4 py-3 text-sm text-muted cursor-not-allowed"
          >
            📧 Email sign in — coming soon
          </button>
        </div>

        <p className="text-center text-xs text-muted">
          By signing in, you agree to our{" "}
          <a href="/en/privacy" className="underline hover:text-white">Privacy Policy</a>{" "}
          and{" "}
          <a href="/en/terms" className="underline hover:text-white">Terms of Service</a>.
        </p>
      </div>
    </main>
  );
}
