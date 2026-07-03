"use server";

import { prisma } from "@/lib/db";
import { scanUrl } from "@/lib/scanner";
import { generateReport } from "@/lib/rules";

// ── Global rate limiter (in-memory, resets on process restart) ──
let globalScanCount = 0;
let globalScanWindow = Date.now();

export async function submitScan(rawUrl: string) {
  // ── P2-6: Global concurrency limit (3 scans/second) ──
  const now = Date.now();
  if (now - globalScanWindow > 1000) {
    globalScanCount = 0;
    globalScanWindow = now;
  }
  globalScanCount++;
  if (globalScanCount > 3) {
    return { error: "Too many requests. Please wait a moment." };
  }

  // Validate
  let url = rawUrl.trim();
  if (!url) return { error: "URL is required" };

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  let domain: string;
  try {
    domain = new URL(url).hostname;
  } catch {
    return { error: "Invalid URL format" };
  }

  // ── P0-1: SSRF protection — block internal addresses ──
  const blockedPattern = /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0)/;
  const blockedHosts = ["localhost", "::1", "[::1]", "0.0.0.0"];
  if (blockedPattern.test(domain) || blockedHosts.includes(domain.toLowerCase())) {
    return { error: "Cannot scan local or internal addresses" };
  }

  // Create scan record
  const scan = await prisma.scan.create({
    data: { url, domain, status: "running" },
  });

  try {
    // Execute scan
    const scanResult = await scanUrl(url);

    // Generate report
    const report = generateReport(scanResult);

    // Update database
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: "completed",
        score: report.totalScore,
        riskLevel: report.riskLevel,
        result: JSON.parse(JSON.stringify(report)),
      },
    });

    return { scanId: scan.id };
  } catch (err) {
    // ── P0-2: Sanitize error — log internally, return generic message ──
    console.error(`[Comply] Scan failed for ${url}:`, err instanceof Error ? err.message : err);

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: "failed",
        result: { error: "Scan failed. The site may be unreachable or timed out." },
      },
    });
    return { error: "Scan failed. The site may be unreachable or timed out." };
  }
}

export async function getScan(scanId: string) {
  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan) return { error: "Scan not found" };
  return { scan: JSON.parse(JSON.stringify(scan)) };
}

export async function getRecentScans(limit = 10) {
  const scans = await prisma.scan.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return { scans: JSON.parse(JSON.stringify(scans)) };
}
