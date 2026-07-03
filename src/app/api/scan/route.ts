/**
 * POST /api/scan — 合规扫描 API（IP Rate Limit + 公开）
 * Comply is a free tool. No sign-up required.
 */

import { NextRequest, NextResponse } from "next/server";
import { scanUrl } from "@/lib/scanner";
import { generateReport } from "@/lib/rules";
import { prisma } from "@/lib/db";

// ── In-Memory Rate Limiter ───────────────────────────
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, remaining: 4, resetIn: 60 };
  }
  if (entry.count >= 5) {
    return { allowed: false, remaining: 0, resetIn: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true, remaining: 5 - entry.count, resetIn: Math.ceil((entry.resetAt - now) / 1000) };
}

let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateMap) { if (now > entry.resetAt) rateMap.delete(key); }
  }, 300_000);
}
ensureCleanup();

// ── POST: 执行扫描 ───────────────────────────────────

export async function POST(req: NextRequest) {
  // Rate Limit (5 per minute per IP)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip") || "unknown";
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: `Too many requests. Try again in ${rateCheck.resetIn}s.` },
      { status: 429, headers: { "Retry-After": String(rateCheck.resetIn) } }
    );
  }

  // Parse URL
  let body: { url?: string };
  try {
    body = (await req.json()) as { url?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const rawUrl = body.url?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "url_required", message: "Please provide a URL" }, { status: 400 });
  }

  let url = rawUrl;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  let domain: string;
  try { domain = new URL(url).hostname; } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  // Create scan record
  const scan = await prisma.scan.create({
    data: { url, domain, status: "running" },
  });

  // Execute scan
  let scanResult;
  try {
    scanResult = await scanUrl(url);
  } catch (scanErr) {
    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: "failed", result: { error: String(scanErr) } },
    });
    return NextResponse.json(
      { error: "scan_failed", message: "Site unreachable or blocking requests.", scanId: scan.id },
      { status: 502 }
    );
  }

  // Generate report
  const report = generateReport(scanResult);
  await prisma.scan.update({
    where: { id: scan.id },
    data: { status: "completed", score: report.totalScore, riskLevel: report.riskLevel, result: JSON.parse(JSON.stringify(report)) },
  });

  return NextResponse.json({ scanId: scan.id, report });
}

// ── GET: 查询历史 ─────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scanId = searchParams.get("id");

  if (scanId) {
    const scan = await prisma.scan.findUnique({ where: { id: scanId } });
    if (!scan) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(scan);
  }

  const scans = await prisma.scan.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, url: true, domain: true, status: true, score: true, riskLevel: true, createdAt: true },
  });
  return NextResponse.json({ scans });
}
