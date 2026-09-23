import { Link } from "@/i18n/routing";
import { kitoblarniOlish, turlarniOlish, yonalishlarniOlish } from "@/lib/api";
import KitobKartochka from "@/components/KitobKartochka";
import FiltrSidebar from "@/components/FiltrSidebar";
import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

interface KatalogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    turi?: string;
    yonalish?: string;
    til?: string;
    mavjudlik?: string;
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
  const lang = locale as "uz" | "ru" | "en";

  const sahifaRaqam = search.sahifa ? parseInt(search.sahifa, 10) : 1;
  const yilDan = search.yil_dan ? parseInt(search.yil_dan, 10) : undefined;
  const yilGacha = search.yil_gacha ? parseInt(search.yil_gacha, 10) : undefined;

  const [kitoblarRes, turlar, yonalishlar] = await Promise.all([
    kitoblarniOlish({
      turi: search.turi,
      yonalish: search.yonalish,
      til: search.til,
      mavjudlik: search.mavjudlik,
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

  // Faol filtrlar — har birini alohida olib tashlash mumkin.
  const faolFiltrlar: { kalit: string; yorliq: string }[] = [];
  if (search.turi) {
    const tur = turlar.find((x) => x.slug === search.turi);
    faolFiltrlar.push({
      kalit: "turi",
      yorliq: tur ? tur.nomi[lang] || tur.nomi.uz : search.turi,
    });
  }
  if (search.yonalish) {
    const yoyilgan = yonalishlar.flatMap((y) => [y, ...(y.bolalar || [])]);
    const yon = yoyilgan.find((y) => y.slug === search.yonalish);
    faolFiltrlar.push({
      kalit: "yonalish",
      yorliq: yon ? yon.nomi[lang] || yon.nomi.uz : search.yonalish,
    });
  }
  if (search.til) {
    faolFiltrlar.push({ kalit: "til", yorliq: t(`kitobTili`) + ": " + search.til.toUpperCase() });
  }
  if (search.mavjudlik) {
    faolFiltrlar.push({
      kalit: "mavjudlik",
      yorliq:
        search.mavjudlik === "bosma" ? t("mavjudlikBosma") : t("mavjudlikRaqamli"),
    });
  }
  if (search.q) {
    faolFiltrlar.push({ kalit: "q", yorliq: `“${search.q}”` });
  }

  const urlYasash = (ozgarish: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const joriy: Record<string, string | undefined> = {
      turi: search.turi,
      yonalish: search.yonalish,
      til: search.til,
      mavjudlik: search.mavjudlik,
      yil_dan: search.yil_dan,
      yil_gacha: search.yil_gacha,
      q: search.q,
      saralash: search.saralash,
      sahifa: search.sahifa,
      ...ozgarish,
    };
    Object.entries(joriy).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    const qs = q.toString();
    return qs ? `/katalog?${qs}` : "/katalog";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="font-display text-[26px] sm:text-[32px] text-ink">{t("sarlavha")}</h1>

      {/* Qidiruv va saralash */}
      <form method="GET" className="mt-5 flex flex-col sm:flex-row gap-2">
        {search.turi && <input type="hidden" name="turi" value={search.turi} />}
        {search.yonalish && <input type="hidden" name="yonalish" value={search.yonalish} />}
        {search.til && <input type="hidden" name="til" value={search.til} />}
        {search.mavjudlik && (
          <input type="hidden" name="mavjudlik" value={search.mavjudlik} />
        )}

        <div className="relative flex-1">
          <Search
            size={18}
            strokeWidth={1.75}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            name="q"
            defaultValue={search.q || ""}
            type="search"
            placeholder={t("qidiruvPlaceholder")}
            aria-label={t("qidiruvPlaceholder")}
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface border border-line-2 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        <select
          name="saralash"
          defaultValue={search.saralash || "-qoshilgan_sana"}
          aria-label={t("saralash.yangi")}
          className="h-11 px-3.5 rounded-xl bg-surface border border-line-2 text-[14px] text-ink-2 cursor-pointer focus:outline-none focus:border-brand transition-colors"
        >
          <option value="-qoshilgan_sana">{t("saralash.yangi")}</option>
          <option value="-korishlar_soni">{t("saralash.kopOqilgan")}</option>
          <option value="nomi">{t("saralash.nomi")}</option>
          <option value="-yil">{t("saralash.yil")}</option>
        </select>

        <button
          type="submit"
          className="h-11 px-6 rounded-xl bg-brand hover:bg-brand-strong text-on-brand text-[15px] font-semibold transition-colors"
        >
          {t("qidirish")}
        </button>
      </form>

      {faolFiltrlar.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {faolFiltrlar.map((f) => (
            <Link
              key={f.kalit}
              href={urlYasash({ [f.kalit]: undefined, sahifa: undefined })}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-brand-soft text-brand-ink text-[13px] hover:bg-brand hover:text-on-brand transition-colors"
            >
              <span>{f.yorliq}</span>
              <X size={13} strokeWidth={2.5} />
            </Link>
          ))}
          <Link
            href="/katalog"
            className="text-[13px] text-muted hover:text-brand transition-colors px-1"
          >
            {t("tozalash")}
          </Link>
        </div>
      )}

      <div className="mt-8 grid lg:grid-cols-[230px_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
        <aside className="lg:sticky lg:top-24">
          <FiltrSidebar turlar={turlar} yonalishlar={yonalishlar} />
        </aside>

        <main>
          <div className="flex items-baseline justify-between text-[13px] text-muted mb-5">
            <span>{t("topildi", { n: jamiKitoblar })}</span>
            {jamiSahifalar > 1 && (
              <span>
                {t("sahifa")} {sahifaRaqam}/{jamiSahifalar}
              </span>
            )}
          </div>

          {kitoblar.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {kitoblar.map((kitob, i) => (
                <KitobKartochka key={kitob.slug} kitob={kitob} priority={i < 4} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <h2 className="font-display text-[20px] text-ink">{t("topilmadi")}</h2>
              <p className="mt-2 text-[14px] text-muted">{t("topilmadiTavsif")}</p>
              <Link
                href="/katalog"
                className="inline-block mt-6 h-11 leading-[44px] px-6 rounded-xl bg-brand hover:bg-brand-strong text-on-brand text-[14px] font-semibold transition-colors"
              >
                {t("tozalash")}
              </Link>
            </div>
          )}

          {jamiSahifalar > 1 && (
            <nav
              aria-label={t("sahifa")}
              className="mt-12 flex items-center justify-center gap-1.5"
            >
              {sahifaRaqam > 1 && (
                <Link
                  href={urlYasash({ sahifa: String(sahifaRaqam - 1) })}
                  aria-label={t("oldingi")}
                  className="w-9 h-9 rounded-lg border border-line text-ink-2 hover:border-brand hover:text-brand flex items-center justify-center transition-colors"
                >
                  <ChevronLeft size={16} />
                </Link>
              )}

              {Array.from({ length: jamiSahifalar }, (_, i) => i + 1)
                .filter(
                  (n) =>
                    n === 1 || n === jamiSahifalar || Math.abs(n - sahifaRaqam) <= 1
                )
                .map((n, i, arr) => (
                  <span key={n} className="flex items-center gap-1.5">
                    {i > 0 && arr[i - 1] !== n - 1 && (
                      <span className="text-muted px-1">…</span>
                    )}
                    <Link
                      href={urlYasash({ sahifa: String(n) })}
                      aria-current={n === sahifaRaqam ? "page" : undefined}
                      className={`w-9 h-9 rounded-lg text-[14px] flex items-center justify-center transition-colors tabular-nums ${
                        n === sahifaRaqam
                          ? "bg-brand text-on-brand"
                          : "border border-line text-ink-2 hover:border-brand hover:text-brand"
                      }`}
                    >
                      {n}
                    </Link>
                  </span>
                ))}

              {sahifaRaqam < jamiSahifalar && (
                <Link
                  href={urlYasash({ sahifa: String(sahifaRaqam + 1) })}
                  aria-label={t("keyingi")}
                  className="w-9 h-9 rounded-lg border border-line text-ink-2 hover:border-brand hover:text-brand flex items-center justify-center transition-colors"
                >
                  <ChevronRight size={16} />
                </Link>
              )}
            </nav>
          )}
        </main>
      </div>
    </div>
  );
}
