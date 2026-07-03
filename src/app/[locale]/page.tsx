import { getTranslations } from "next-intl/server";
import { ScanForm } from "@/components/ScanForm";
import Link from "next/link";

export default async function HomePage() {
  const t = await getTranslations("landing");

  const features = [
    { icon: "🔒", key: "f_ssl_title", desc: "f_ssl_desc" },
    { icon: "🛡️", key: "f_headers_title", desc: "f_headers_desc" },
    { icon: "📜", key: "f_legal_title", desc: "f_legal_desc" },
    { icon: "🍪", key: "f_cookies_title", desc: "f_cookies_desc" },
    { icon: "📊", key: "f_report_title", desc: "f_report_desc" },
    { icon: "🌍", key: "f_i18n_title", desc: "f_i18n_desc" },
  ];

  const steps = [
    { step: "1", icon: "🔗", key: "how_1" },
    { step: "2", icon: "⚡", key: "how_2" },
    { step: "3", icon: "📋", key: "how_3" },
  ];

  return (
    <main className="flex-1">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 pt-20 pb-16 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium ring-1 ring-primary/20 mb-6">
            🛡️ {t("badge")}
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
            {t("headline")}
          </h1>
          <p className="mt-4 text-lg text-muted max-w-xl mx-auto leading-relaxed">
            {t("subheadline")}
          </p>

          {/* Scan Form in Hero */}
          <div className="mt-10">
            <ScanForm />
            <p className="mt-3 text-xs text-muted">
              {t("hero_hint")}
            </p>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ─────────────────────────────────────── */}
      <section className="border-y border-border/50 bg-neutral-950/50">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted">
          <span>✅ {t("trust_ssl")}</span>
          <span>✅ {t("trust_headers")}</span>
          <span>✅ {t("trust_legal")}</span>
          <span>✅ {t("trust_privacy")}</span>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">{t("features_title")}</h2>
            <p className="mt-3 text-muted max-w-lg mx-auto">{t("features_sub")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.key} className="rounded-xl border border-border bg-neutral-900/30 p-6 hover:bg-neutral-900/50 transition-colors">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-1">{t(f.key)}</h3>
                <p className="text-xs text-muted leading-relaxed">{t(f.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="py-20 bg-neutral-950/30">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">{t("how_title")}</h2>
            <p className="mt-3 text-muted">{t("how_sub")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.key} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-sm mb-3 ring-1 ring-primary/30">
                  {s.step}
                </div>
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className="text-sm text-foreground">{t(s.key)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">{t("cta_title")}</h2>
          <p className="text-muted mb-6">{t("cta_sub")}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            {t("cta_button")}
          </Link>
        </div>
      </section>
    </main>
  );
}
