import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

// ── 从 JSON result 中提取类型化的报告数据 ──
interface ReportResult {
  url?: string;
  domain?: string;
  timestamp?: string;
  totalScore?: number;
  riskLevel?: "green" | "yellow" | "red";
  riskLabel?: string;
  summary?: {
    totalChecks?: number;
    passed?: number;
    failed?: number;
    criticalCount?: number;
  };
  sections?: ReportSectionData[];
  fixGuide?: FixItemData[];
}

interface ReportSectionData {
  category?: string;
  label?: string;
  icon?: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  status?: "pass" | "warn" | "fail";
  items?: { name?: string; passed?: boolean; detail?: string; severity?: string; fix?: string }[];
}

interface FixItemData {
  priority?: number;
  category?: string;
  name?: string;
  severity?: string;
  fix?: string;
}

export default async function ReportPage({ params }: Props) {
  const { id, locale } = await params;
  const scan = await prisma.scan.findUnique({ where: { id } });
  if (!scan) notFound();

  const t = await getTranslations("report");
  const st = await getTranslations("status");

  const result = (scan.result as ReportResult) ?? {};

  const riskConfig = {
    green: {
      bg: "from-success/10 to-success/5",
      border: "border-success/20",
      text: "text-success",
      badge: "bg-success/20 text-success ring-success/30",
      dot: "bg-success",
      label: t("green"),
    },
    yellow: {
      bg: "from-warning/10 to-warning/5",
      border: "border-warning/20",
      text: "text-warning",
      badge: "bg-warning/20 text-warning ring-warning/30",
      dot: "bg-warning",
      label: t("yellow"),
    },
    red: {
      bg: "from-danger/10 to-danger/5",
      border: "border-danger/20",
      text: "text-danger",
      badge: "bg-danger/20 text-danger ring-danger/30",
      dot: "bg-danger",
      label: t("red"),
    },
  };

  const rc = riskConfig[result.riskLevel ?? "green"];
  const sections = result.sections ?? [];
  const fixGuide = result.fixGuide ?? [];
  const summary = result.summary ?? {};

  return (
    <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        &larr; {t("back")}
      </Link>

      {/* ── Hero Banner ── */}
      <div className={`mt-6 rounded-2xl border ${rc.border} bg-gradient-to-br ${rc.bg} p-6 sm:p-8`}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
              {result.domain ?? (scan.domain as string)}
            </h1>
            <p className="text-sm text-muted break-all">
              {result.url ?? (scan.url as string)}
            </p>
            <p className="text-xs text-muted">
              {result.timestamp
                ? new Date(result.timestamp).toLocaleString(locale === "zh" ? "zh-CN" : locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : new Date(scan.createdAt as Date).toLocaleString(
                    locale === "zh" ? "zh-CN" : locale,
                    { dateStyle: "medium", timeStyle: "short" }
                  )}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ring-1 ${rc.badge}`}>
              <span className={`w-2 h-2 rounded-full ${rc.dot}`} />
              {rc.label}
            </span>
            <span className={`text-4xl sm:text-5xl font-bold ${rc.text}`}>
              {result.totalScore ?? (scan.score as number) ?? "—"}
              <span className="text-lg text-muted font-normal">/100</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Summary Grid ── */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label={t("totalChecks")}
          value={String(summary.totalChecks ?? "-")}
        />
        <StatCard
          label={t("passed")}
          value={String(summary.passed ?? "-")}
          className="text-success"
        />
        <StatCard
          label={t("failed")}
          value={String(summary.failed ?? "-")}
          className="text-danger"
        />
        <StatCard
          label={t("critical")}
          value={String(summary.criticalCount ?? "-")}
          className={summary.criticalCount && summary.criticalCount > 0 ? "text-danger" : "text-muted"}
        />
      </div>

      {/* ── Section Breakdown ── */}
      {sections.length > 0 && (
        <div className="mt-10 space-y-6">
          <h2 className="text-lg font-semibold text-white">{t("details")}</h2>

          {sections.map((section) => {
            const pct = section.percentage ?? 0;
            const barColor =
              pct >= 80 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-danger";
            const items = section.items ?? [];

            return (
              <div
                key={section.category}
                className="rounded-xl border border-border bg-neutral-900/30 overflow-hidden"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{section.icon}</span>
                    <h3 className="text-sm font-semibold text-white">{section.label}</h3>
                    <span className="text-xs text-muted ml-1">
                      {section.score}/{section.maxScore}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-semibold text-muted">
                    {pct}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-neutral-800">
                  <div
                    className={`h-full ${barColor} transition-all duration-700 ease-out`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>

                {/* Items */}
                <div className="px-5 py-3 space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 py-1.5">
                      <span className="mt-0.5 text-sm shrink-0">
                        {item.passed ? "✅" : "❌"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            {item.name}
                          </span>
                          {item.severity && (
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                item.severity === "high"
                                  ? "bg-danger/20 text-danger"
                                  : item.severity === "medium"
                                    ? "bg-warning/20 text-warning"
                                    : "bg-neutral-700 text-muted"
                              }`}
                            >
                              {item.severity}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">{item.detail}</p>
                        {!item.passed && item.fix && (
                          <p className="text-xs text-primary/80 mt-1 italic">
                            💡 {item.fix}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Fix Guide (Prioritized Actionable List) ── */}
      {fixGuide.length > 0 && (
        <div className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-white">{t("fixGuide")}</h2>
          <p className="text-sm text-muted">{t("fixGuideDesc")}</p>

          <div className="space-y-2">
            {fixGuide.map((fix) => (
              <div
                key={fix.priority}
                className="flex items-start gap-4 rounded-lg border border-border bg-neutral-900/50 px-4 py-3"
              >
                <span className="text-xs font-mono font-bold text-muted w-5 shrink-0 pt-0.5">
                  #{fix.priority}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {fix.name}
                    </span>
                    <Badge severity={fix.severity} />
                    <span className="text-xs text-muted">{fix.category}</span>
                  </div>
                  <p className="text-xs text-muted mt-1">{fix.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!result.totalScore && !result.sections && !result.fixGuide && (
        <div className="mt-10 py-12 text-center">
          <p className="text-muted">
            {scan.status === "running" ? st("running") : st(scan.status as string)}
          </p>
        </div>
      )}
{/* ── Cross-Linking Matrix ── */}            <section className="border-t border-border mt-12 pt-12">              <div className="text-center mb-8">                <h3 className="text-xl font-bold text-white mb-2">While you&apos;re here — try our other free tools</h3>                <p className="text-sm text-muted">Built by KAKI LLC for solopreneurs and indie hackers.</p>              </div>              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">                <a href="https://kaki.llc?utm_source=comply&utm_medium=report" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-neutral-900/30 p-4 hover:border-primary/50 hover:bg-neutral-900/50 transition-colors text-left">                  <div className="text-lg mb-1">📋</div>                  <h4 className="text-sm font-semibold text-white">KAKI — AI Tool Suite</h4>                  <p className="text-xs text-muted mt-1">Cover letters, cold emails, resumes, and more — all AI-powered.</p>                </a>                <a href="https://hooki.io?utm_source=comply&utm_medium=report" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-neutral-900/30 p-4 hover:border-primary/50 hover:bg-neutral-900/50 transition-colors text-left">                  <div className="text-lg mb-1">🪝</div>                  <h4 className="text-sm font-semibold text-white">Hooki — Webhook Debug Console</h4>                  <p className="text-xs text-muted mt-1">Capture, inspect, and replay webhooks in real time.</p>                </a>                <a href="https://dash.kaki.llc?utm_source=comply&utm_medium=report" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-neutral-900/30 p-4 hover:border-primary/50 hover:bg-neutral-900/50 transition-colors text-left">                  <div className="text-lg mb-1">📊</div>                  <h4 className="text-sm font-semibold text-white">DashCore — Unified Dashboard</h4>                  <p className="text-xs text-muted mt-1">Monitor Product Hunt analytics, revenue, and server health from one place.</p>                </a>                <a href="https://flowingpulse.com?utm_source=comply&utm_medium=report" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-neutral-900/30 p-4 hover:border-primary/50 hover:bg-neutral-900/50 transition-colors text-left">                  <div className="text-lg mb-1">📈</div>                  <h4 className="text-sm font-semibold text-white">FlowingPulse — Financial Runway Tracker</h4>                  <p className="text-xs text-muted mt-1">Track your SaaS financial runway and plan ahead.</p>                </a>                <a href="https://chart.flowingpulse.com?utm_source=comply&utm_medium=report" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-neutral-900/30 p-4 hover:border-primary/50 hover:bg-neutral-900/50 transition-colors text-left">                  <div className="text-lg mb-1">📊</div>                  <h4 className="text-sm font-semibold text-white">ChartFlow — Notion Chart Builder</h4>                  <p className="text-xs text-muted mt-1">Create beautiful embeddable charts from your Notion databases.</p>                </a>                <a href="https://tax.flowingpulse.com?utm_source=comply&utm_medium=report" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-neutral-900/30 p-4 hover:border-primary/50 hover:bg-neutral-900/50 transition-colors text-left">                  <div className="text-lg mb-1">🧾</div>                  <h4 className="text-sm font-semibold text-white">TaxFlow — Invoice && Tax Helper</h4>                  <p className="text-xs text-muted mt-1">Generate invoices and estimate taxes for your freelance business.</p>                </a>              </div>            </section>
    </main>
  );
}

// ── Shared Components ──

function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-neutral-900/50 p-4 space-y-1">
      <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${className || "text-foreground"}`}>{value}</p>
    </div>
  );
}

function Badge({ severity }: { severity?: string }) {
  const colors: Record<string, string> = {
    high: "bg-danger/20 text-danger",
    medium: "bg-warning/20 text-warning",
    low: "bg-neutral-700 text-muted",
  };
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors[severity ?? "low"]}`}
    >
      {severity ?? "low"}
    </span>
  );
}
