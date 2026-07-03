import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/routing";
import { auth } from "@/lib/auth";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: { template: "%s | Comply", default: "Comply — Free Website Compliance Scanner" },
  description: "Scan any website for SSL, security headers, legal pages & cookie compliance. Get an actionable report in seconds. Free, no sign-up.",
  metadataBase: new URL("https://comply.kaki.llc"),
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      zh: "/zh",
      de: "/de",
      es: "/es",
      fr: "/fr",
      ja: "/ja",
      ko: "/ko",
      pt: "/pt",
    },
  },
  openGraph: {
    title: "Comply — Free Website Compliance Scanner",
    description: "Scan any website for SSL, security headers, legal pages & cookie compliance. Free, no sign-up.",
    url: "https://comply.kaki.llc",
    siteName: "Comply",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Comply — Free Website Compliance Scanner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Comply — Free Website Compliance Scanner",
    description: "Scan any website for SSL, security headers, legal pages & cookie compliance. Free, no sign-up.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Comply",
  url: "https://comply.kaki.llc",
  description: "Free website compliance scanner — check SSL, security headers, legal pages, and cookie compliance in seconds. No sign-up required.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Organization",
    name: "KAKI LLC",
    url: "https://kaki.llc",
  },
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();
  const session = await auth();

  const utm = "?utm_source=comply&utm_medium=footer";

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-dvh flex flex-col bg-background text-foreground">
        <Providers>
          <NextIntlClientProvider messages={messages}>
            <Navbar locale={locale} session={session} />
            {children}
            {/* ── Footer: cross-linking matrix with UTM ── */}
            <footer className="border-t border-border py-10 mt-auto">
              <div className="max-w-5xl mx-auto px-4">
                <div className="mb-8">
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Our Projects</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <a href={`https://kaki.llc${utm}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-primary transition-colors">KAKI — AI Tool Suite</a>
                    <a href={`https://hooki.io${utm}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-primary transition-colors">Hooki — Webhook Debug Console</a>
                    <a href={`https://dash.kaki.llc${utm}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-primary transition-colors">DashCore — Unified Dashboard</a>
                    <a href={`https://flowingpulse.com${utm}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-primary transition-colors">FlowingPulse — Financial Runway Tracker</a>
                    <a href={`https://tax.flowingpulse.com${utm}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-primary transition-colors">TaxFlow — Invoice &amp; Tax Helper</a>
                    <a href={`https://chart.flowingpulse.com${utm}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-primary transition-colors">ChartFlow — Notion Chart Builder</a>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
                  <p className="text-xs text-muted">&copy; {new Date().getFullYear()} KAKI LLC</p>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <a href={`/${locale}/privacy`} className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href={`/${locale}/terms`} className="hover:text-white transition-colors">Terms of Service</a>
                  </div>
                </div>
              </div>
            </footer>
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
