import Image from "next/image";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { kitobniOlish, kitoblarniOlish } from "@/lib/api";
import { getTranslations } from "next-intl/server";

interface KitobDetailPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export const revalidate = 3600; // ISR: 1 hour

export default async function KitobDetailPage({ params }: KitobDetailPageProps) {
  const { slug, locale } = await params;
  const kitob = await kitobniOlish(slug);

  if (!kitob) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "kitob" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const currentLocale = locale as "uz" | "ru" | "en";

  // O'xshash kitoblarni olish (bir xil yo'nalishdagi)
  const yonalishSlug =
    kitob.yonalishlar && kitob.yonalishlar.length > 0
      ? kitob.yonalishlar[0].slug
      : undefined;

  const oxshashRes = await kitoblarniOlish({
    yonalish: yonalishSlug,
    turi: kitob.turi.slug,
  });

  const oxshashKitoblar = oxshashRes.natijalar
    .filter((k) => k.slug !== kitob.slug)
    .slice(0, 3);

  const birinchiPdf = kitob.fayllar?.find((f) => f.format === "pdf");
  const birinchiEpub = kitob.fayllar?.find((f) => f.format === "epub");

  const mualliflarMatni =
    kitob.mualliflar && kitob.mualliflar.length > 0
      ? kitob.mualliflar.join(", ")
      : t("muallifYoq");

  const turNomi = kitob.turi.nomi[currentLocale] || kitob.turi.nomi.uz;

  const yonalishlarMatni =
    kitob.yonalishlar && kitob.yonalishlar.length > 0
      ? kitob.yonalishlar
          .map((y) => y.nomi[currentLocale] || y.nomi.uz)
          .join(" → ")
      : turNomi;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {/* 1. Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-8 font-medium"
      >
        <Link
          href="/"
          className="hover:text-sky-800 dark:hover:text-sky-400 transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">home</span>
          <span>{tNav("boshSahifa")}</span>
        </Link>
        <span>/</span>
        <Link
          href="/katalog"
          className="hover:text-sky-800 dark:hover:text-sky-400 transition-colors"
        >
          {tNav("katalog")}
        </Link>
        <span>/</span>
        <span className="text-sky-900 dark:text-sky-300 font-bold truncate max-w-md">
          {kitob.nomi}
        </span>
      </nav>

      {/* 2. Main Showcase */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xs mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: 3D Cover & Action buttons (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* 3D Book Cover */}
            <div className="relative w-full max-w-[320px] aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-xl mb-6 group border border-slate-200 dark:border-slate-800">
              {kitob.muqova ? (
                <Image
                  src={kitob.muqova}
                  alt={kitob.nomi}
                  fill
                  priority
                  className="object-cover group-hover:scale-102 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-500">
                  <span className="material-symbols-outlined text-6xl text-sky-400 dark:text-sky-500 mb-3">
                    menu_book
                  </span>
                  <span className="font-bold text-sm text-slate-600 dark:text-slate-300 line-clamp-4 font-display">
                    {kitob.nomi}
                  </span>
                </div>
              )}

              {/* Status pill overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 backdrop-blur-md text-emerald-200 text-xs font-semibold shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{t("onlaynMutolaa")}</span>
                </span>
              </div>
            </div>

            {/* Read Buttons */}
            <div className="w-full max-w-[320px] flex flex-col gap-2.5">
              {birinchiPdf ? (
                <Link
                  href={`/kitob/${kitob.slug}/oqish/${birinchiPdf.id}`}
                  className="w-full py-3.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-bold text-sm text-center shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    auto_stories
                  </span>
                  <span>
                    {t("mutolaaQilish")} (PDF
                    {birinchiPdf.sahifalar_soni
                      ? ` - ${birinchiPdf.sahifalar_soni} ${t("bet")}`
                      : ""}
                    )
                  </span>
                </Link>
              ) : (
                <div className="w-full py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium text-xs text-center">
                  {t("faylYoq")}
                </div>
              )}

              {birinchiEpub && (
                <Link
                  href={`/kitob/${kitob.slug}/oqish/${birinchiEpub.id}`}
                  className="w-full py-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-800 dark:text-teal-300 font-semibold text-xs text-center border border-teal-200 dark:border-teal-800 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    phone_iphone
                  </span>
                  <span>{t("epubOqish")}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Metadata & Synopsis (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Category tag */}
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
                {turNomi}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                {yonalishlarMatni}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-extrabold text-2xl sm:text-4xl text-slate-900 dark:text-white leading-tight mb-4 font-display">
              {kitob.nomi}
            </h1>

            {/* Author */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-slate-800 text-sky-800 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">
                  person
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 block font-medium">
                  {t("muallif")}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {mualliflarMatni}
                </span>
              </div>
            </div>

            {/* 4-Box Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider mb-1">
                  {t("nashriyot")}
                </span>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate block">
                  {kitob.nashriyot || t("nomalum")}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider mb-1">
                  {t("chiqarilganYili")}
                </span>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {kitob.yil || t("nomalum")}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider mb-1">
                  {t("tili")}
                </span>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase">
                  {kitob.til}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider mb-1">
                  {t("korishlar")}
                </span>
                <span className="font-bold text-xs text-teal-700 dark:text-teal-400">
                  {kitob.korishlar_soni} {t("marta")}
                </span>
              </div>
            </div>

            {/* Synopsis / Annotation */}
            <div className="mb-6">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-3 font-display">
                {t("haqida")}
              </h2>
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 whitespace-pre-line">
                {kitob.tavsif ||
                  "Ushbu darslik tibbiyot va hamshiralik ishi bo‘yicha talabalar hamda mutaxassislar uchun mo‘ljallangan ilmiy-amaliy qo‘llanma hisoblanadi."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Related Books */}
      {oxshashKitoblar.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-slate-900 dark:text-white font-display">
              {t("oxshash")}
            </h3>
            <Link
              href={`/katalog?yonalish=${yonalishSlug}`}
              className="text-xs font-bold text-sky-800 dark:text-sky-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1"
            >
              <span>{t("yonalishdagiBarchasi")}</span>
              <span className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {oxshashKitoblar.map((k) => (
              <div
                key={k.slug}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-sky-700 dark:text-sky-400 block mb-1">
                    {k.turi.nomi[currentLocale] || k.turi.nomi.uz}
                  </span>
                  <Link href={`/kitob/${k.slug}`}>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 hover:text-sky-800 dark:hover:text-sky-400 line-clamp-2 mb-1">
                      {k.nomi}
                    </h4>
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">
                    {k.mualliflar?.join(", ") || t("muallifYoq")}
                  </p>
                </div>
                <Link
                  href={`/kitob/${k.slug}`}
                  className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1"
                >
                  <span>{t("korish")}</span>
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
