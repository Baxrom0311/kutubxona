import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { kitobniOlish, kitoblarniOlish } from "@/lib/api";
import KitobKartochka from "@/components/KitobKartochka";
import Muqova from "@/components/Muqova";
import { getTranslations } from "next-intl/server";
import { BookOpen, ChevronRight, Library, Smartphone } from "lucide-react";

interface KitobDetailPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const dynamic = "force-dynamic";

export default async function KitobDetailPage({ params }: KitobDetailPageProps) {
  const { slug, locale } = await params;
  const kitob = await kitobniOlish(slug);

  if (!kitob) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "kitob" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const lang = locale as "uz" | "ru" | "en";

  const yonalishSlug = kitob.yonalishlar?.[0]?.slug;

  const oxshashRes = await kitoblarniOlish({
    yonalish: yonalishSlug,
    turi: kitob.turi.slug,
  });
  const oxshashKitoblar = oxshashRes.natijalar
    .filter((k) => k.slug !== kitob.slug)
    .slice(0, 4);

  const pdf = kitob.fayllar?.find((f) => f.format === "pdf");
  const epub = kitob.fayllar?.find((f) => f.format === "epub");

  const mualliflarMatni =
    kitob.mualliflar && kitob.mualliflar.length > 0
      ? kitob.mualliflar.join(", ")
      : t("muallifYoq");

  const turNomi = kitob.turi.nomi[lang] || kitob.turi.nomi.uz;
  const yonalishNomi =
    kitob.yonalishlar?.[0]?.nomi?.[lang] || kitob.yonalishlar?.[0]?.nomi?.uz || turNomi;

  // Bosma kitobda qarzga berilganlari ayirilgan bo'sh nusxalar ko'rsatiladi.
  const bosmaKitob = kitob.mavjudlik === "bosma" || !kitob.oqish_mumkin;
  const jamiNusxa = kitob.nusxalar_soni ?? 1;
  const boshNusxa = kitob.bosh_nusxalar_soni ?? jamiNusxa;
  const hammasiBand = bosmaKitob && boshNusxa <= 0;

  const malumotlar = [
    { yorliq: t("nashriyot"), qiymat: kitob.nashriyot || t("nomalum") },
    { yorliq: t("chiqarilganYili"), qiymat: kitob.yil ? String(kitob.yil) : t("nomalum") },
    {
      yorliq: t("tili"),
      qiymat: kitob.til ? t(`tillar.${kitob.til}`) : t("nomalum"),
    },
    ...(bosmaKitob
      ? [{ yorliq: t("boshNusxalar"), qiymat: `${boshNusxa} / ${jamiNusxa}` }]
      : []),
    { yorliq: t("korishlar"), qiymat: String(kitob.korishlar_soni ?? 0) },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <nav
        aria-label={tNav("katalog")}
        className="flex items-center gap-1.5 text-[13px] text-muted mb-8"
      >
        <Link href="/katalog" className="hover:text-brand transition-colors">
          {tNav("katalog")}
        </Link>
        <ChevronRight size={14} className="flex-shrink-0" />
        <Link
          href={`/katalog?yonalish=${yonalishSlug || ""}`}
          className="hover:text-brand transition-colors truncate"
        >
          {yonalishNomi}
        </Link>
      </nav>

      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-10 lg:gap-14 items-start">
        {/* Muqova va o'qish tugmalari */}
        <div className="flex flex-col gap-4 max-w-[260px] mx-auto lg:mx-0 w-full">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface-2 shadow-lift">
            <Muqova
              slug={kitob.slug}
              nomi={kitob.nomi}
              muqova={kitob.muqova}
              muallif={mualliflarMatni}
              priority
              katta
              sizes="260px"
            />
          </div>

          {kitob.oqish_mumkin ? (
            <>
              {pdf && (
                <Link
                  href={`/kitob/${kitob.slug}/oqish/${pdf.id}`}
                  className="h-12 rounded-xl bg-brand hover:bg-brand-strong text-on-brand text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <BookOpen size={18} strokeWidth={1.75} />
                  <span>{t("mutolaaQilish")}</span>
                </Link>
              )}
              {epub && (
                <Link
                  href={`/kitob/${kitob.slug}/oqish/${epub.id}`}
                  className={`h-12 rounded-xl text-[15px] font-medium flex items-center justify-center gap-2 transition-colors ${
                    pdf
                      ? "border border-line-2 text-ink-2 hover:border-brand hover:text-brand"
                      : "bg-brand hover:bg-brand-strong text-on-brand font-semibold"
                  }`}
                >
                  <Smartphone size={18} strokeWidth={1.75} />
                  <span>{t("epubOqish")}</span>
                </Link>
              )}
            </>
          ) : (
            /* Bosma nusxa — onlayn o'qish yo'q, kitob kutubxonadan olinadi. */
            <div className="rounded-xl bg-surface-2 px-4 py-4 flex gap-3">
              <Library size={19} strokeWidth={1.75} className="text-brand flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[14px] font-medium text-ink">
                  {hammasiBand ? t("hammasiBerilgan") : t("bosmaSarlavha")}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  {hammasiBand ? t("hammasiBerilganTavsif") : t("bosmaTavsif")}
                </p>
                <div
                  className={`mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-semibold ${
                    hammasiBand
                      ? "bg-surface text-muted"
                      : "bg-brand/10 text-brand"
                  }`}
                >
                  <span>📚</span>
                  <span>
                    {hammasiBand
                      ? `${t("boshNusxalar")}: 0 / ${jamiNusxa}`
                      : t("boshBor", { n: boshNusxa })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {kitob.oqish_mumkin && pdf?.sahifalar_soni ? (
            <p className="text-[13px] text-muted text-center">
              PDF · {pdf.sahifalar_soni} {t("bet")}
            </p>
          ) : null}
        </div>

        {/* Ma'lumotlar */}
        <div>
          <p className="text-[13px] text-brand">{turNomi}</p>
          <h1 className="mt-2 font-display text-[28px] sm:text-[36px] leading-[1.15] text-ink">
            {kitob.nomi}
          </h1>
          <p className="mt-3 text-[16px] text-ink-2">{mualliflarMatni}</p>

          <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 py-6 border-y border-line">
            {malumotlar.map((m) => (
              <div key={m.yorliq}>
                <dt className="text-[13px] text-muted">{m.yorliq}</dt>
                <dd className="mt-1 text-[14px] text-ink">{m.qiymat}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8">
            <h2 className="font-display text-[19px] text-ink mb-3">{t("haqida")}</h2>
            <p className="text-[15px] leading-[1.7] text-ink-2 whitespace-pre-line max-w-[70ch]">
              {kitob.tavsif || t("defaultTavsif")}
            </p>
          </div>
        </div>
      </div>

      {oxshashKitoblar.length > 0 && (
        <section className="mt-16 sm:mt-20 pt-10 border-t border-line">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-[22px] text-ink">{t("oxshash")}</h2>
            <Link
              href={`/katalog?yonalish=${yonalishSlug || ""}`}
              className="text-[14px] text-brand hover:text-brand-strong transition-colors"
            >
              {t("yonalishdagiBarchasi")}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-6">
            {oxshashKitoblar.map((k) => (
              <KitobKartochka key={k.slug} kitob={k} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
