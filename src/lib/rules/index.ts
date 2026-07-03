/**
 * Comply 规则引擎 — 评分计算、等级判定、报告生成
 */

import type { ScanResult, RiskLevel, SectionResult, CheckItem } from "../scanner";

// ── 规则定义 ──────────────────────────────────────────────

export interface RuleDef {
  id: string;
  category: "ssl" | "headers" | "legal" | "cookies";
  name: string;
  weight: number;
  severity: "low" | "medium" | "high";
  check: (result: ScanResult) => { passed: boolean; detail: string };
}

export const ALL_RULES: RuleDef[] = [
  // SSL/TLS
  {
    id: "ssl-01", category: "ssl", name: "HTTPS Enabled", weight: 12, severity: "high",
    check: (r) => ({
      passed: r.sections.ssl.items[0]?.passed ?? false,
      detail: r.sections.ssl.items[0]?.detail ?? "Unable to verify HTTPS",
    }),
  },
  {
    id: "ssl-02", category: "ssl", name: "HTTP→HTTPS Redirect", weight: 8, severity: "high",
    check: (r) => ({
      passed: r.sections.ssl.items[1]?.passed ?? false,
      detail: r.sections.ssl.items[1]?.detail ?? "Unable to verify redirect",
    }),
  },
  {
    id: "ssl-03", category: "ssl", name: "HSTS Header", weight: 5, severity: "medium",
    check: (r) => ({
      passed: r.sections.ssl.items[2]?.passed ?? false,
      detail: r.sections.ssl.items[2]?.detail ?? "Unable to verify HSTS",
    }),
  },

  // Headers — 全部驱动自扫描结果
  {
    id: "hdr-01", category: "headers", name: "Content-Security-Policy", weight: 10, severity: "high",
    check: (r) => {
      const item = r.sections.headers.items.find((i) => i.name === "CSP");
      return { passed: item?.passed ?? false, detail: item?.detail ?? "" };
    },
  },
  {
    id: "hdr-02", category: "headers", name: "Strict-Transport-Security", weight: 5, severity: "high",
    check: (r) => {
      const item = r.sections.headers.items.find((i) => i.name === "HSTS");
      return { passed: item?.passed ?? false, detail: item?.detail ?? "" };
    },
  },
  {
    id: "hdr-03", category: "headers", name: "X-Frame-Options", weight: 5, severity: "medium",
    check: (r) => {
      const item = r.sections.headers.items.find((i) => i.name === "X-Frame-Options");
      return { passed: item?.passed ?? false, detail: item?.detail ?? "" };
    },
  },
  {
    id: "hdr-04", category: "headers", name: "X-Content-Type-Options", weight: 5, severity: "medium",
    check: (r) => {
      const item = r.sections.headers.items.find((i) => i.name === "X-Content-Type-Options");
      return { passed: item?.passed ?? false, detail: item?.detail ?? "" };
    },
  },
  {
    id: "hdr-05", category: "headers", name: "Referrer-Policy", weight: 5, severity: "low",
    check: (r) => {
      const item = r.sections.headers.items.find((i) => i.name === "Referrer-Policy");
      return { passed: item?.passed ?? false, detail: item?.detail ?? "" };
    },
  },
  {
    id: "hdr-06", category: "headers", name: "Permissions-Policy", weight: 3, severity: "low",
    check: (r) => {
      const item = r.sections.headers.items.find((i) => i.name === "Permissions-Policy");
      return { passed: item?.passed ?? false, detail: item?.detail ?? "" };
    },
  },
  {
    id: "hdr-07", category: "headers", name: "COOP", weight: 2, severity: "low",
    check: (r) => {
      const item = r.sections.headers.items.find((i) => i.name === "COOP");
      return { passed: item?.passed ?? false, detail: item?.detail ?? "" };
    },
  },

  // 法务
  {
    id: "leg-01", category: "legal", name: "Privacy Policy", weight: 15, severity: "high",
    check: (r) => ({
      passed: r.sections.legal.items[0]?.passed ?? false,
      detail: r.sections.legal.items[0]?.detail ?? "Unable to verify Privacy Policy",
    }),
  },
  {
    id: "leg-02", category: "legal", name: "Terms of Service", weight: 15, severity: "high",
    check: (r) => ({
      passed: r.sections.legal.items[1]?.passed ?? false,
      detail: r.sections.legal.items[1]?.detail ?? "Unable to verify Terms of Service",
    }),
  },

  // Cookie
  {
    id: "ck-01", category: "cookies", name: "Cookie Consent Banner", weight: 10, severity: "medium",
    check: (r) => ({
      passed: r.sections.cookies.items[0]?.passed ?? false,
      detail: r.sections.cookies.items[0]?.detail ?? "Unable to verify Cookie Consent",
    }),
  },
];

// ── 评估函数 ──────────────────────────────────────────────

export interface RuleResult {
  ruleId: string;
  category: string;
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  severity: "low" | "medium" | "high";
  detail: string;
}

export interface RulesEvaluation {
  results: RuleResult[];
  totalScore: number;
  riskLevel: RiskLevel;
  passedCount: number;
  failedCount: number;
  criticalFailed: RuleResult[];
}

export function evaluateRules(scanResult: ScanResult): RulesEvaluation {
  const results: RuleResult[] = ALL_RULES.map((rule) => {
    const { passed, detail } = rule.check(scanResult);
    return {
      ruleId: rule.id,
      category: rule.category,
      name: rule.name,
      passed,
      score: passed ? rule.weight : 0,
      maxScore: rule.weight,
      severity: rule.severity,
      detail,
    };
  });

  const totalScore = results.reduce((s, r) => s + r.score, 0);
  const riskLevel: RiskLevel = totalScore >= 80 ? "green" : totalScore >= 50 ? "yellow" : "red";
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;
  const criticalFailed = results.filter((r) => !r.passed && r.severity === "high");

  return { results, totalScore, riskLevel, passedCount, failedCount, criticalFailed };
}

// ── 报告生成 ──────────────────────────────────────────────

export interface ReportSection {
  category: string;
  label: string;
  icon: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: "pass" | "warn" | "fail";
  items: ReportItem[];
}

export interface ReportItem {
  name: string;
  passed: boolean;
  detail: string;
  severity: string;
  fix?: string;
}

export interface ScanReport {
  url: string;
  domain: string;
  timestamp: string;
  totalScore: number;
  riskLevel: RiskLevel;
  riskLabel: string;
  sections: ReportSection[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    criticalCount: number;
  };
  fixGuide: FixItem[];
}

export interface FixItem {
  priority: number;
  category: string;
  name: string;
  severity: string;
  fix: string;
}

const RISK_LABELS: Record<RiskLevel, string> = {
  green: "合规良好 ✅",
  yellow: "存在风险 ⚠️",
  red: "严重不合规 🚨",
};

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  ssl: { label: "SSL/TLS", icon: "🔒" },
  headers: { label: "安全 Headers", icon: "🛡️" },
  legal: { label: "法务页面", icon: "📜" },
  cookies: { label: "Cookie Consent", icon: "🍪" },
};

export function generateReport(scanResult: ScanResult): ScanReport {
  const evaluation = evaluateRules(scanResult);

  const sections: ReportSection[] = (["ssl", "headers", "legal", "cookies"] as const).map((cat) => {
    const catResults = evaluation.results.filter((r) => r.category === cat);
    const score = catResults.reduce((s, r) => s + r.score, 0);
    const maxScore = catResults.reduce((s, r) => s + r.maxScore, 0);
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const status: "pass" | "warn" | "fail" = pct >= 80 ? "pass" : pct >= 40 ? "warn" : "fail";

    return {
      category: cat,
      label: CATEGORY_LABELS[cat]?.label ?? cat,
      icon: CATEGORY_LABELS[cat]?.icon ?? "",
      score,
      maxScore,
      percentage: pct,
      status,
      items: catResults.map((r) => ({
        name: r.name,
        passed: r.passed,
        detail: r.detail,
        severity: r.severity,
        fix: generateFixForRule(r),
      })),
    };
  });

  const fixGuide = generateFixGuide(evaluation);

  return {
    url: scanResult.url,
    domain: scanResult.domain,
    timestamp: scanResult.timestamp,
    totalScore: evaluation.totalScore,
    riskLevel: evaluation.riskLevel,
    riskLabel: RISK_LABELS[evaluation.riskLevel],
    sections,
    summary: {
      totalChecks: evaluation.results.length,
      passed: evaluation.passedCount,
      failed: evaluation.failedCount,
      criticalCount: evaluation.criticalFailed.length,
    },
    fixGuide,
  };
}

// ── 修复指南 ──────────────────────────────────────────────

function generateFixForRule(rule: RuleResult): string | undefined {
  const fixes: Record<string, string> = {
    "ssl-01": "为域名配置 SSL 证书，推荐使用 Let's Encrypt（免费）或 Cloudflare SSL",
    "ssl-02": "配置 Nginx/Apache 将 HTTP 流量 301 永久重定向到 HTTPS",
    "ssl-03": '添加 HSTS 响应头: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    "hdr-01": "添加 Content-Security-Policy 头限制资源加载来源，降低 XSS 攻击面",
    "hdr-02": '添加 Strict-Transport-Security 头: max-age=31536000; includeSubDomains',
    "hdr-03": "添加 X-Frame-Options: DENY 防止点击劫持攻击",
    "hdr-04": "添加 X-Content-Type-Options: nosniff 防止 MIME 类型嗅探",
    "hdr-05": "添加 Referrer-Policy: strict-origin-when-cross-origin 控制引用信息泄露",
    "hdr-06": "添加 Permissions-Policy 头限制浏览器 API 使用",
    "hdr-07": "添加 Cross-Origin-Opener-Policy: same-origin 隔离跨域窗口",
    "leg-01": "创建隐私政策页面（/privacy），说明数据收集、使用、存储方式。可使用 Comply 模板。",
    "leg-02": "创建服务条款页面（/terms），明确用户权利义务。可使用 Comply 模板。",
    "ck-01": "添加 Cookie Consent 横幅，提供接受/拒绝选项，满足 GDPR/CCPA 合规要求",
  };

  return rule.passed ? undefined : (fixes[rule.ruleId] ?? `需要修复: ${rule.name}`);
}

function generateFixGuide(evaluation: RulesEvaluation): FixItem[] {
  return evaluation.results
    .filter((r) => !r.passed)
    .sort((a, b) => {
      const sevOrder = { high: 0, medium: 1, low: 2 };
      return (sevOrder[a.severity] ?? 0) - (sevOrder[b.severity] ?? 0);
    })
    .map((r, idx) => ({
      priority: idx + 1,
      category: r.category,
      name: r.name,
      severity: r.severity,
      fix: generateFixForRule(r) ?? `修复: ${r.name}`,
    }));
}
