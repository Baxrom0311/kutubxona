import { Link } from "@/i18n/routing";
import { kitoblarniOlish, yonalishlarniOlish } from "@/lib/api";
import KitobKartochka from "@/components/KitobKartochka";
import Muqova from "@/components/Muqova";
import OpenAiChatButton from "@/components/OpenAiChatButton";
import { Yonalish } from "@/lib/types";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Search, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

/** Ierarxiyani tekis ro'yxatga yoyadi — yo'nalishlar sonini hisoblash uchun. */
function yoyish(yonalishlar: Yonalish[]): Yonalish[] {
  return yonalishlar.flatMap((y) => [y, ...yoyish(y.bolalar || [])]);
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const lang = locale as "uz" | "ru" | "en";

  const [kitoblarRes, yonalishlar] = await Promise.all([
    kitoblarniOlish({ saralash: "-qoshilgan_sana" }),
    yonalishlarniOlish(),
  ]);

  const yangiKitoblar = kitoblarRes.natijalar.slice(0, 5);
  const jamiKitoblar = kitoblarRes.soni;
  // Kitobi ko'p yo'nalishlar oldinda — bo'sh yo'nalishlar oxirida.
  const barchaYonalishlar = yoyish(yonalishlar).sort(
    (a, b) => (b.kitoblar_soni ?? 0) - (a.kitoblar_soni ?? 0)
  );

  // Hero uchun — fonddagi eng yangi uchta kitob.
  const muqovalar = kitoblarRes.natijalar.slice(0, 3);

  return (
    <div className="w-full">
      {/* ── Hero: qidiruv ──────────────────────────────────── */}
      <section className="bg-surface border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-18 grid lg:grid-cols-[minmax(0,1fr)_360px] gap-12 lg:gap-16 items-center">
          <div className="max-w-xl">
            <h1 className="rise rise-1 font-display text-[32px] sm:text-[42px] lg:text-[48px] leading-[1.08] text-ink">
              {t("sarlavha")}
            </h1>

            <form
              action={`/${locale}/katalog`}
              method="GET"
              className="rise rise-2 mt-8 flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1">
                <Search
                  size={18}
                  strokeWidth={1.75}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  name="q"
                  type="search"
                  placeholder={t("qidiruvPlaceholder")}
                  aria-label={t("qidiruvPlaceholder")}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-paper border border-line-2 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-brand focus:bg-surface transition-colors"
                />
              </div>
              <button
                type="submit"
                className="h-12 px-6 rounded-xl bg-brand hover:bg-brand-strong text-on-brand text-[15px] font-semibold transition-colors"
              >
                {t("qidirish")}
              </button>
            </form>

            <p className="rise rise-3 mt-4 text-[13px] text-muted">
              {t("fondKitoblar", { n: jamiKitoblar })} ·{" "}
              {t("fondYonalishlar", { n: barchaYonalishlar.length })}
            </p>
          </div>

          {/* Muqovalar — sahifadagi yagona bezak */}
          {muqovalar.length > 0 && (
            <div className="rise rise-3 hidden lg:flex justify-center items-center h-[290px]">
              <div className="relative w-[360px] h-[270px]">
                {muqovalar.map((kitob, i) => {
                  const joylashuv = [
                    "left-0 top-7 -rotate-6 w-[130px] z-0",
                    "left-1/2 -translate-x-1/2 top-0 w-[160px] z-20",
                    "right-0 top-7 rotate-6 w-[130px] z-10",
                  ][i];
                  return (
                    <Link
                      key={kitob.slug}
                      href={`/kitob/${kitob.slug}`}
                      title={kitob.nomi}
                      className={`absolute ${joylashuv} aspect-[3/4] rounded-lg overflow-hidden shadow-lift ring-1 ring-black/5 hover:-translate-y-1.5 transition-transform duration-300`}
                    >
                      <Muqova
                        slug={kitob.slug}
                        nomi={kitob.nomi}
                        muqova={kitob.muqova}
                        priority={i === 1}
                        sizes="165px"
                      />
                      {/* Yon kitoblar orqada turadi — soyalangani ularni
                          old kitobdan ajratadi. */}
                      {i !== 1 && <div className="absolute inset-0 bg-black/35" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Yo'nalishlar ───────────────────────────────────── */}
      {barchaYonalishlar.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-[22px] sm:text-[26px] text-ink">
              {t("yonalishlar")}
            </h2>
            <Link
              href="/katalog"
              className="text-[14px] text-brand hover:text-brand-strong transition-colors"
            >
              {t("barchasi")}
            </Link>
          </div>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10">
            {barchaYonalishlar.map((y) => (
              <li key={y.slug} className="border-b border-line">
                <Link
                  href={`/katalog?yonalish=${y.slug}`}
                  className="group flex items-baseline justify-between gap-4 py-3.5"
                >
                  <span className="text-[15px] text-ink-2 group-hover:text-brand transition-colors">
                    {y.nomi?.[lang] || y.nomi?.uz}
                  </span>
                  <span className="text-[13px] text-muted tabular-nums">
                    {y.kitoblar_soni}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Yangi qo'shilganlar ────────────────────────────── */}
      {yangiKitoblar.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14 sm:pb-16">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-[22px] sm:text-[26px] text-ink">
              {t("yangiKitoblar")}
            </h2>
            <Link
              href="/katalog?saralash=-qoshilgan_sana"
              className="text-[14px] text-brand hover:text-brand-strong transition-colors"
            >
              {t("barchasi")}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6">
            {yangiKitoblar.map((kitob) => (
              <KitobKartochka key={kitob.slug} kitob={kitob} />
            ))}
          </div>
        </section>
      )}

      {/* ── AI maslahatchi ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-2xl bg-surface border border-line px-6 py-7 sm:px-8 sm:py-8 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
          <Sparkles
            size={26}
            strokeWidth={1.5}
            className="text-brand flex-shrink-0"
            aria-hidden="true"
          />
          <div className="flex-1">
            <h2 className="font-display text-[19px] text-ink">{t("aiSarlavha")}</h2>
            <p className="mt-1 text-[14px] text-muted">{t("aiTavsif")}</p>
          </div>
          <OpenAiChatButton className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-brand hover:bg-brand-strong text-on-brand text-[14px] font-semibold transition-colors flex-shrink-0 cursor-pointer">
            <span>{t("aiTugma")}</span>
            <ArrowRight size={16} strokeWidth={2} />
          </OpenAiChatButton>
        </div>
      </section>
    </div>
  );
}
