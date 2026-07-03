"use server";

import { prisma } from "@/lib/db";
import { scanUrl } from "@/lib/scanner";
import { generateReport } from "@/lib/rules";

export async function submitScan(rawUrl: string) {
  // 校验
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

  // 创建扫描记录
  const scan = await prisma.scan.create({
    data: { url, domain, status: "running" },
  });

  try {
    // 执行扫描
    const scanResult = await scanUrl(url);

    // 生成报告
    const report = generateReport(scanResult);

    // 更新数据库
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
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: "failed",
        result: { error: String(err) },
      },
    });
    return { error: "Scan failed. The site may be unreachable." };
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
