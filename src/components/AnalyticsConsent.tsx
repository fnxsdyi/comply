"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "kaki-consent";

/**
 * Privacy-friendly analytics consent banner (GDPR/CCPA).
 *
 * - SSR + initial client render: banner is SHOWN so static compliance crawlers
 *   can detect it in the raw HTML.
 * - After hydration: if a decision already exists, the banner is hidden.
 * - Umami (self-hosted, first-party, no third-party tracking) is injected ONLY
 *   after the user clicks "Accept". Decline removes it and clears any stored id.
 *
 * This is an "informed opt-in" posture: the cleanest for both GDPR (EU) and
 * CCPA (US). To switch to opt-out (load by default, let users decline), change
 * `if (stored === "accepted")` to `if (stored !== "rejected")` in the effect.
 */
export default function AnalyticsConsent({
  websiteId,
  privacyUrl = "/privacy",
}: {
  websiteId: string;
  privacyUrl?: string;
}) {
  const [consent, setConsent] = useState<"accepted" | "rejected" | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as
        | "accepted"
        | "rejected"
        | null;
      setConsent(stored);
      if (stored === "accepted") injectUmami(websiteId);
    } catch {
      /* localStorage unavailable — fail safe: no tracking */
    }
  }, [websiteId]);

  function injectUmami(id: string) {
    if (document.getElementById("kaki-umami")) return;
    const s = document.createElement("script");
    s.id = "kaki-umami";
    s.defer = true;
    s.src = "https://a.kaki.llc/script.js";
    s.setAttribute("data-website-id", id);
    document.head.appendChild(s);
  }

  function removeUmami() {
    const s = document.getElementById("kaki-umami");
    if (s) s.remove();
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.toLowerCase().includes("umami")) localStorage.removeItem(k);
      });
      document.cookie.split(";").forEach((c) => {
        const name = c.split("=")[0].trim();
        if (name.toLowerCase().includes("umami")) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      });
    } catch {
      /* ignore */
    }
  }

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsent("accepted");
    injectUmami(websiteId);
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, "rejected");
    setConsent("rejected");
    removeUmami();
  }

  // SSR + initial client render show the banner (compliance crawlers see it).
  // Post-hydration, hide it once a decision exists.
  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent banner"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#0f172a",
        color: "#e2e8f0",
        padding: "14px 18px",
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "14px",
        lineHeight: 1.5,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.35)",
      }}
    >
      <span style={{ flex: "1 1 320px" }}>
        We use self-hosted, privacy-friendly analytics (Umami) to improve our
        product. No third-party tracking, no data selling, and we respect
        Do-Not-Track. See our{" "}
        <a
          href={privacyUrl}
          style={{ color: "#60a5fa", textDecoration: "underline" }}
        >
          Privacy Policy
        </a>
        .
      </span>
      <span style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={reject}
          style={{
            background: "transparent",
            color: "#cbd5e1",
            border: "1px solid #475569",
            borderRadius: 6,
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          Decline
        </button>
        <button
          type="button"
          onClick={accept}
          style={{
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          Accept
        </button>
      </span>
    </div>
  );
}
