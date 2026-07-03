import { getTranslations } from "next-intl/server";

export default async function TermsPage() {
  const t = await getTranslations("terms");
  return (
    <main className="flex-1 px-4 py-16">
      <div className="max-w-2xl mx-auto prose prose-invert">
        <h1 className="text-3xl font-bold text-white mb-8">{t("title")}</h1>
        <p className="text-muted mb-6">Last updated: July 1, 2026</p>

        <h2 className="text-xl font-semibold text-white mt-8 mb-4">{t("s1_title")}</h2>
        <p className="text-muted leading-relaxed">{t("s1_body")}</p>

        <h2 className="text-xl font-semibold text-white mt-8 mb-4">{t("s2_title")}</h2>
        <p className="text-muted leading-relaxed">{t("s2_body")}</p>

        <h2 className="text-xl font-semibold text-white mt-8 mb-4">{t("s3_title")}</h2>
        <p className="text-muted leading-relaxed">{t("s3_body")}</p>

        <h2 className="text-xl font-semibold text-white mt-8 mb-4">{t("s4_title")}</h2>
        <p className="text-muted leading-relaxed">{t("s4_body")}</p>

        <h2 className="text-xl font-semibold text-white mt-8 mb-4">{t("s5_title")}</h2>
        <p className="text-muted leading-relaxed">{t("s5_body")}</p>

        <h2 className="text-xl font-semibold text-white mt-8 mb-4">{t("s6_title")}</h2>
        <p className="text-muted leading-relaxed">{t("s6_body")} contact@kaki.llc</p>
      </div>
    </main>
  );
}
