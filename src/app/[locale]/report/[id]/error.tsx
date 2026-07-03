"use client";

import { useEffect } from "react";

export default function ReportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[report] Error:", error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-bold text-white">Report Unavailable</h1>
        <p className="text-sm text-muted">
          Something went wrong while loading this report. It may have been deleted or the database is temporarily unreachable.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
