import { Link } from "@/i18n/routing";
import { kitoblarniOlish, turlarniOlish, yonalishlarniOlish } from "@/lib/api";
import KitobKartochka from "@/components/KitobKartochka";
import FiltrSidebar from "@/components/FiltrSidebar";
import { getTranslations } from "next-intl/server";

interface KatalogPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    turi?: string;
    yonalish?: string;
    til?: string;
    yil_dan?: string;
    yil_gacha?: string;
    q?: string;
    saralash?: string;
    sahifa?: string;
  }>;
}

export default async function KatalogPage({ params, searchParams }: KatalogPageProps) {
  const { locale } = await params;
  const search = await searchParams;

  const t = await getTranslations({ locale, namespace: "katalog" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const sahifaRaqam = search.sahifa ? parseInt(search.sahifa, 10) : 1;
  const yilDan = search.yil_dan ? parseInt(search.yil_dan, 10) : undefined;
  const yilGacha = search.yil_gacha ? parseInt(search.yil_gacha, 10) : undefined;

  // Parallel fetch: books, forms, subjects
  const [kitoblarRes, turlar, yonalishlar] = await Promise.all([
    kitoblarniOlish({
      turi: search.turi,
      yonalish: search.yonalish,
      til: search.til,
      yil_dan: yilDan,
      yil_gacha: yilGacha,
      q: search.q,
      saralash: search.saralash || "-qoshilgan_sana",
      sahifa: sahifaRaqam,
    }),
    turlarniOlish(),
    yonalishlarniOlish(),
  ]);

  const jamiKitoblar = kitoblarRes.soni;
  const kitoblar = kitoblarRes.natijalar;
  const jamiSahifalar = Math.ceil(jamiKitoblar / 24) || 1;

  // Faol filtrlar teglari
  const faolFiltrlar: { kalit: string; qiymat: string; yorliq: string }[] = [];
  if (search.turi) {
    const tur = turlar.find((tItem) => tItem.slug === search.turi);
    const turNomi = tur
      ? tur.nomi[locale as "uz" | "ru" | "en"] || tur.nomi.uz
      : search.turi;
    faolFiltrlar.push({
      kalit: "turi",
      qiymat: "",
      yorliq: `${t("kitobTuri")}: ${turNomi}`,
    });
  }
  if (search.yonalish) {
    const yon = yonalishlar.find((y) => y.slug === search.yonalish);
    const yonNomi = yon
      ? yon.nomi[locale as "uz" | "ru" | "en"] || yon.nomi.uz
      : search.yonalish;
    faolFiltrlar.push({
      kalit: "yonalish",
      qiymat: "",
      yorliq: `${t("yonalishlar")}: ${yonNomi}`,
    });
  }
  if (search.til) {
    faolFiltrlar.push({
      kalit: "til",
      qiymat: "",
      yorliq: `${t("kitobTili")}: ${search.til.toUpperCase()}`,
    });
  }
  if (search.q) {
    faolFiltrlar.push({
      kalit: "q",
      qiymat: "",
      yorliq: `"${search.q}"`,
    });
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {/* 1. Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium"
      >
        <Link
          href="/"
          className="hover:text-sky-800 dark:hover:text-sky-400 transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">home</span>
          <span>{tNav("boshSahifa")}</span>
        </Link>
        <span>/</span>
        <span className="text-sky-900 dark:text-sky-300 font-bold">
          {t("sarlavha")}
        </span>
      </nav>

      {/* 2. Top Search & Sort Bar */}
      <section className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
        <form
          method="GET"
          className="flex flex-col md:flex-row items-stretch md:items-center gap-3"
        >
          <div className="relative flex-1 flex items-center">
            <span className="material-symbols-outlined absolute left-4 text-sky-700 dark:text-sky-400 text-[24px]">
              search
            </span>
            <input
              name="q"
              defaultValue={search.q || ""}
              type="text"
              placeholder={t("qidiruvPlaceholder")}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Sort Select */}
            <div className="relative flex-1 md:flex-initial min-w-[200px]">
              <select
                name="saralash"
                defaultValue={search.saralash || "-qoshilgan_sana"}
                className="w-full h-12 appearance-none rounded-xl bg-slate-50 dark:bg-slate-800 px-4 pr-10 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="-qoshilgan_sana">{t("saralash.yangi")}</option>
                <option value="-korishlar_soni">{t("saralash.kopOqilgan")}</option>
                <option value="nomi">{t("saralash.nomi")}</option>
                <option value="-yil">{t("saralash.yil")}</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[20px]">
                expand_more
              </span>
            </div>

            <button
              type="submit"
              className="h-12 px-6 rounded-xl bg-sky-800 hover:bg-sky-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                filter_list
              </span>
              <span>{t("qidirish")}</span>
            </button>
          </div>
        </form>

        {/* Active Filter Chips */}
        {faolFiltrlar.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
              {t("faolFiltrlar")}
            </span>
            {faolFiltrlar.map((f) => (
              <span
                key={f.yorliq}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-xs font-semibold"
              >
                <span>{f.yorliq}</span>
              </span>
            ))}
            <Link
              href="/katalog"
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">
                restart_alt
              </span>
              <span>{t("tozalash")}</span>
            </Link>
          </div>
        )}
      </section>

      {/* 3. Main Grid Layout (Sidebar + Books) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Filter Sidebar (3 cols) */}
        <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24">
          <FiltrSidebar turlar={turlar} yonalishlar={yonalishlar} />
        </aside>

        {/* Right Books Content (9 cols) */}
        <main className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          {/* Header count */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("jami")}{" "}
              <strong className="text-sky-900 dark:text-sky-300 font-bold">
                {jamiKitoblar}
              </strong>{" "}
              {t("jamiTopildi")}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {t("sahifa")} {sahifaRaqam} / {jamiSahifalar}
            </span>
          </div>

          {/* Book Cards Grid */}
          {kitoblar.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {kitoblar.map((kitob) => (
                <KitobKartochka key={kitob.slug} kitob={kitob} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">
                  menu_book
                </span>
              </div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2 font-display">
                {t("topilmadi")}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                {t("topilmadiTavsif")}
              </p>
              <Link
                href="/katalog"
                className="px-6 py-3 rounded-xl bg-sky-800 hover:bg-sky-900 text-white text-xs font-bold transition-colors"
              >
                {t("barchasiniTozalash")}
              </Link>
            </div>
          )}

          {/* Pagination */}
          {jamiSahifalar > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 pb-12">
              {sahifaRaqam > 1 && (
                <Link
                  href={`/katalog?sahifa=${sahifaRaqam - 1}`}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    chevron_left
                  </span>
                  <span>{t("oldingi")}</span>
                </Link>
              )}

              {Array.from({ length: Math.min(jamiSahifalar, 7) }, (_, i) => i + 1).map(
                (num) => (
                  <Link
                    key={num}
                    href={`/katalog?sahifa=${num}`}
                    className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-colors ${
                      sahifaRaqam === num
                        ? "bg-sky-800 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {num}
                  </Link>
                )
              )}

              {sahifaRaqam < jamiSahifalar && (
                <Link
                  href={`/katalog?sahifa=${sahifaRaqam + 1}`}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <span>{t("keyingi")}</span>
                  <span className="material-symbols-outlined text-[16px]">
                    chevron_right
                  </span>
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
