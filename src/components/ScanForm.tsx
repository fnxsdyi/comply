"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { submitScan } from "@/lib/actions";

export function ScanForm() {
  const t = useTranslations("landing");
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || scanning) return;
    setError(null);
    setScanning(true);
    try {
      const result = await submitScan(url.trim());
      if (result?.scanId) {
        window.location.href = `/report/${result.scanId}`;
      } else if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("placeholder")}
          disabled={scanning}
          className="flex-1 rounded-lg border border-border bg-neutral-900 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={scanning || !url.trim()}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50 min-w-[100px]"
        >
          {scanning ? (
            <span className="inline-flex items-center gap-1.5">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("scanning")}
            </span>
          ) : (
            t("button")
          )}
        </button>
      </div>
      {error && <p className="text-xs text-danger text-center">{error}</p>}
    </form>
  );
}
