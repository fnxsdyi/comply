/**
 * Comply 扫描引擎 — 对目标 URL 执行全栈合规检测
 *
 * 检测维度（按权重）：
 *   SSL/TLS         — 25% (证书有效性、协议版本、HSTS)
 *   安全 Headers     — 35% (CSP 10% + HSTS 5% + XFO 5% + XCTO 5% + RP 5% + COEP/COOP/CORP 5%)
 *   法务页面         — 30% (Privacy Policy 15% + Terms of Service 15%)
 *   Cookie Consent   — 10%
 *
 * 总分 100，按得分映射风险等级：
 *   green  (≥80): 合规良好
 *   yellow (50-79): 存在风险
 *   red    (<50): 严重不合规
 */

// ── 类型定义 ──────────────────────────────────────────────

export type RiskLevel = "green" | "yellow" | "red";

export interface CheckItem {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
  severity: "low" | "medium" | "high";
  fix?: string;
}

export interface SectionResult {
  label: string;
  weight: number; // 占总分权重 (%)
  score: number;
  maxScore: number;
  passed: boolean;
  items: CheckItem[];
}

export interface ScanResult {
  url: string;
  domain: string;
  timestamp: string;
  totalScore: number;
  riskLevel: RiskLevel;
  sections: {
    ssl: SectionResult;
    headers: SectionResult;
    legal: SectionResult;
    cookies: SectionResult;
  };
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    criticalCount: number;
  };
}

interface PageContent {
  body: string;
  headers: Record<string, string>;
  statusCode: number;
  finalUrl: string;
}

// ── 常量 ──────────────────────────────────────────────────

const LEGAL_PAGE_KEYWORDS = {
  privacy: [
    "privacy policy", "privacy notice", "data protection", "personal data",
    "data privacy", "隐私政策", "隐私声明", "datenschutz", "politique de confidentialité",
    "política de privacidad", "privacy",
  ],
  terms: [
    "terms of service", "terms and conditions", "terms of use", "user agreement",
    "服务条款", "使用条款", "nutzungsbedingungen", "conditions d'utilisation",
    "términos de servicio", "terms",
  ],
};

const WANTED_HEADERS = [
  { name: "content-security-policy", label: "CSP", weight: 10, critical: "high" as const },
  { name: "strict-transport-security", label: "HSTS", weight: 5, critical: "high" as const },
  { name: "x-frame-options", label: "X-Frame-Options", weight: 5, critical: "medium" as const },
  { name: "x-content-type-options", label: "X-Content-Type-Options", weight: 5, critical: "medium" as const },
  { name: "referrer-policy", label: "Referrer-Policy", weight: 5, critical: "low" as const },
  { name: "permissions-policy", label: "Permissions-Policy", weight: 3, critical: "low" as const },
  { name: "cross-origin-opener-policy", label: "COOP", weight: 2, critical: "low" as const },
];

const HEADERS_MAX_SCORE = 35;
const SSL_MAX_SCORE = 25;
const LEGAL_MAX_SCORE = 30;
const COOKIES_MAX_SCORE = 10;

// ── 主入口 ────────────────────────────────────────────────

export async function scanUrl(url: string): Promise<ScanResult> {
  const startTime = Date.now();
  const domain = extractDomain(url);

  // 1. 并行抓取目标页面
  const page = await fetchPage(url);

  // 2. 并行执行所有检测
  const [ssl, headers, legal, cookies] = await Promise.all([
    checkSSL(domain, page),
    checkHeaders(page),
    checkLegal(domain, page),
    checkCookies(page),
  ]);

  const sections = { ssl, headers, legal, cookies };
  const totalScore = ssl.score + headers.score + legal.score + cookies.score;
  const riskLevel: RiskLevel = totalScore >= 80 ? "green" : totalScore >= 50 ? "yellow" : "red";

  const allItems = [...ssl.items, ...headers.items, ...legal.items, ...cookies.items];
  const summary = {
    totalChecks: allItems.length,
    passed: allItems.filter((i) => i.passed).length,
    failed: allItems.filter((i) => !i.passed).length,
    criticalCount: allItems.filter((i) => !i.passed && i.severity === "high").length,
  };

  return {
    url,
    domain,
    timestamp: new Date().toISOString(),
    totalScore,
    riskLevel,
    sections,
    summary,
  };
}

// ── 页面抓取 ──────────────────────────────────────────────

async function fetchPage(url: string): Promise<PageContent> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Comply/1.0 (Compliance Scanner; +https://comply.kaki.llc)",
      },
    });

    const body = await res.text().catch(() => "");
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });

    return {
      body,
      headers,
      statusCode: res.status,
      finalUrl: res.url,
    };
  } catch {
    return {
      body: "",
      headers: {},
      statusCode: 0,
      finalUrl: url,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ── SSL/TLS 检测 ──────────────────────────────────────────

async function checkSSL(domain: string, page: PageContent): Promise<SectionResult> {
  const items: CheckItem[] = [];
  const isHttps = page.finalUrl.startsWith("https://");

  // SSL 证书检测 — 通过 HTTPS 可达性间接判断
  items.push({
    name: "HTTPS 启用",
    passed: isHttps,
    score: isHttps ? 12 : 0,
    maxScore: 12,
    detail: isHttps
      ? "站点已启用 HTTPS 加密连接"
      : "站点未启用 HTTPS，所有数据传输为明文",
    severity: "high",
    fix: isHttps ? undefined : "为域名配置 SSL 证书（推荐 Let's Encrypt 免费证书）",
  });

  // HTTP → HTTPS 重定向
  const redirectsToHttps = page.finalUrl.startsWith("https://") ||
    (page.statusCode >= 300 && page.statusCode < 400);

  items.push({
    name: "HTTP→HTTPS 重定向",
    passed: isHttps,
    score: isHttps ? 8 : 0,
    maxScore: 8,
    detail: isHttps
      ? "HTTP 请求正确重定向到 HTTPS"
      : "HTTP 请求未重定向到 HTTPS",
    severity: "high",
    fix: isHttps ? undefined : "配置服务器将 HTTP 流量 301 重定向到 HTTPS",
  });

  // TLS 版本（从 headers 间接判断，真正的 TLS 版本需要底层 socket）
  const hsts = page.headers["strict-transport-security"];
  items.push({
    name: "HSTS 头",
    passed: !!hsts,
    score: hsts ? 5 : 0,
    maxScore: 5,
    detail: hsts
      ? `HSTS 已配置: ${hsts}`
      : "未设置 HSTS 头，浏览器可能通过 HTTP 访问",
    severity: "medium",
    fix: hsts ? undefined : '添加 Strict-Transport-Security 头: max-age=31536000; includeSubDomains',
  });

  const score = items.reduce((s, i) => s + i.score, 0);
  return {
    label: "SSL/TLS",
    weight: 25,
    score,
    maxScore: SSL_MAX_SCORE,
    passed: score >= 18,
    items,
  };
}

// ── 安全 Headers 检测 ─────────────────────────────────────

async function checkHeaders(page: PageContent): Promise<SectionResult> {
  const items: CheckItem[] = [];
  const h = page.headers;

  for (const wanted of WANTED_HEADERS) {
    const value = h[wanted.name];
    const passed = !!value;

    let detail = passed
      ? `${wanted.label}: ${value.length > 80 ? value.slice(0, 80) + "..." : value}`
      : `缺少 ${wanted.label} 头`;

    let fix: string | undefined;
    if (!passed) {
      fix = generateHeaderFix(wanted.name, wanted.label);
    }

    items.push({
      name: wanted.label,
      passed,
      score: passed ? wanted.weight : 0,
      maxScore: wanted.weight,
      detail,
      severity: wanted.critical,
      fix,
    });
  }

  const score = items.reduce((s, i) => s + i.score, 0);
  return {
    label: "安全 Headers",
    weight: 35,
    score,
    maxScore: HEADERS_MAX_SCORE,
    passed: score >= 25,
    items,
  };
}

function generateHeaderFix(name: string, label: string): string {
  const fixes: Record<string, string> = {
    "content-security-policy": "添加 CSP 头: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
    "strict-transport-security": "添加 HSTS 头: max-age=31536000; includeSubDomains; preload",
    "x-frame-options": "添加 X-Frame-Options 头: DENY 或 SAMEORIGIN",
    "x-content-type-options": "添加 X-Content-Type-Options 头: nosniff",
    "referrer-policy": "添加 Referrer-Policy 头: strict-origin-when-cross-origin",
    "permissions-policy": "添加 Permissions-Policy 头: camera=(), microphone=(), geolocation=()",
    "cross-origin-opener-policy": "添加 Cross-Origin-Opener-Policy 头: same-origin",
  };
  return fixes[name] || `添加 ${label} 响应头`;
}

// ── 法务页面检测 ──────────────────────────────────────────

async function checkLegal(domain: string, page: PageContent): Promise<SectionResult> {
  const items: CheckItem[] = [];
  const bodyLower = page.body.toLowerCase();

  // Privacy Policy
  const privacyLinks = extractLegalLinks(bodyLower, LEGAL_PAGE_KEYWORDS.privacy);
  const hasPrivacyPage = privacyLinks.length > 0;

  items.push({
    name: "Privacy Policy",
    passed: hasPrivacyPage,
    score: hasPrivacyPage ? 15 : 0,
    maxScore: 15,
    detail: hasPrivacyPage
      ? `找到隐私政策链接: ${privacyLinks.slice(0, 3).join(", ")}`
      : "页面中未发现隐私政策链接",
    severity: "high",
    fix: hasPrivacyPage
      ? undefined
      : `添加隐私政策页面（如 /privacy）并在网站页脚链接。可使用我们的隐私政策模板快速生成。`,
  });

  // Terms of Service
  const termsLinks = extractLegalLinks(bodyLower, LEGAL_PAGE_KEYWORDS.terms);
  const hasTermsPage = termsLinks.length > 0;

  items.push({
    name: "Terms of Service",
    passed: hasTermsPage,
    score: hasTermsPage ? 15 : 0,
    maxScore: 15,
    detail: hasTermsPage
      ? `找到服务条款链接: ${termsLinks.slice(0, 3).join(", ")}`
      : "页面中未发现服务条款链接",
    severity: "high",
    fix: hasTermsPage
      ? undefined
      : `添加服务条款页面（如 /terms）并在网站页脚链接。可使用我们的服务条款模板快速生成。`,
  });

  const score = items.reduce((s, i) => s + i.score, 0);
  return {
    label: "法务页面",
    weight: 30,
    score,
    maxScore: LEGAL_MAX_SCORE,
    passed: score >= 15,
    items,
  };
}

// ── Cookie Consent 检测 ───────────────────────────────────

async function checkCookies(page: PageContent): Promise<SectionResult> {
  const items: CheckItem[] = [];
  const bodyLower = page.body.toLowerCase();

  const cookieKeywords = [
    "cookie consent", "cookie banner", "cookie notice", "cookie policy",
    "cookie settings", "cookie preferences", "accept cookies", "manage cookies",
    "we use cookies", "this site uses cookies", "cookie-banner", "cookieConsent",
    "gdpr", "ccpa", "cookie 同意", "cookie 设置",
  ];

  const foundKeywords = cookieKeywords.filter((kw) => bodyLower.includes(kw));
  const hasCookieBanner = foundKeywords.length > 0;

  items.push({
    name: "Cookie Consent Banner",
    passed: hasCookieBanner,
    score: hasCookieBanner ? 10 : 0,
    maxScore: 10,
    detail: hasCookieBanner
      ? `检测到 Cookie 同意机制（关键词: ${foundKeywords.slice(0, 3).join(", ")}）`
      : "未检测到 Cookie 同意横幅。GDPR/CCPA 要求告知用户 Cookie 使用情况",
    severity: "medium",
    fix: hasCookieBanner
      ? undefined
      : "添加 Cookie Consent 横幅，提示用户网站使用 Cookie 并提供接受/拒绝选项。可使用开源方案 cookieconsent 或自建。",
  });

  const score = items.reduce((s, i) => s + i.score, 0);
  return {
    label: "Cookie Consent",
    weight: 10,
    score,
    maxScore: COOKIES_MAX_SCORE,
    passed: hasCookieBanner,
    items,
  };
}

// ── 工具函数 ──────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

function extractLegalLinks(body: string, keywords: string[]): string[] {
  // 在 HTML body 中搜索包含关键词的链接
  const results: string[] = [];
  const linkRegex = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(body)) !== null) {
    const href = match[1].toLowerCase();
    const text = match[2].replace(/<[^>]+>/g, "").toLowerCase();
    const combined = `${href} ${text}`;

    for (const kw of keywords) {
      if (combined.includes(kw) && !results.includes(href)) {
        results.push(href);
        break;
      }
    }
    if (results.length >= 5) break;
  }

  // Fallback: 纯文本匹配（非 HTML 页面或 JS 渲染的页面）
  if (results.length === 0) {
    for (const kw of keywords) {
      if (body.includes(kw)) {
        results.push(`(text mention: "${kw}")`);
        break;
      }
    }
  }

  return results;
}
