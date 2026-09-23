"use client";

import { useState } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Turi, Yonalish } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

interface FiltrSidebarProps {
  turlar: Turi[];
  yonalishlar: Yonalish[];
}

export default function FiltrSidebar({ turlar, yonalishlar }: FiltrSidebarProps) {
  const t = useTranslations("katalog");
  const locale = useLocale() as "uz" | "ru" | "en";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tanlanganTur = searchParams.get("turi") || "";
  const tanlanganYonalish = searchParams.get("yonalish") || "";
  const tanlanganTil = searchParams.get("til") || "";
  const tanlanganMavjudlik = searchParams.get("mavjudlik") || "";
  const [yilDan, setYilDan] = useState(searchParams.get("yil_dan") || "");
  const [yilGacha, setYilGacha] = useState(searchParams.get("yil_gacha") || "");
  const [ochiqOta, setOchiqOta] = useState<Record<string, boolean>>({});
  const [drawerOchiq, setDrawerOchiq] = useState(false);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("sahifa");
    router.push(`${pathname}?${params.toString()}`);
  };

  const yilQollash = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (yilDan) params.set("yil_dan", yilDan);
    else params.delete("yil_dan");
    if (yilGacha) params.set("yil_gacha", yilGacha);
    else params.delete("yil_gacha");
    params.delete("sahifa");
    router.push(`${pathname}?${params.toString()}`);
  };

  const tozalash = () => {
    setYilDan("");
    setYilGacha("");
    router.push(pathname);
  };

  const faolSoni = [
    tanlanganTur,
    tanlanganYonalish,
    tanlanganTil,
    tanlanganMavjudlik,
    searchParams.get("yil_dan") || searchParams.get("yil_gacha"),
  ].filter(Boolean).length;

  const qatorKlass = (faol: boolean) =>
    `w-full flex items-baseline justify-between gap-2 px-2.5 py-2 rounded-lg text-[14px] text-left transition-colors ${
      faol ? "bg-brand-soft text-brand-ink font-medium" : "text-ink-2 hover:bg-surface-2"
    }`;

  const bolim = (sarlavha: string, mazmun: React.ReactNode) => (
    <div>
      <h3 className="text-[13px] font-semibold text-ink mb-2 px-2.5">{sarlavha}</h3>
      {mazmun}
    </div>
  );

  const filtrlar = (
    <div className="space-y-7">
      {bolim(
        t("mavjudlik"),
        <div className="-mx-0.5">
          {[
            { qiymat: "", nom: t("barchasi") },
            { qiymat: "raqamli", nom: t("mavjudlikRaqamli") },
            { qiymat: "bosma", nom: t("mavjudlikBosma") },
          ].map((item) => (
            <button
              key={item.qiymat || "barchasi"}
              type="button"
              onClick={() => updateParam("mavjudlik", item.qiymat)}
              className={qatorKlass(tanlanganMavjudlik === item.qiymat)}
            >
              <span>{item.nom}</span>
            </button>
          ))}
        </div>
      )}

      {bolim(
        t("kitobTuri"),
        <div className="-mx-0.5">
          <button type="button" onClick={() => updateParam("turi", "")} className={qatorKlass(!tanlanganTur)}>
            <span>{t("barchasi")}</span>
          </button>
          {turlar.map((tur) => (
            <button
              key={tur.slug}
              type="button"
              onClick={() => updateParam("turi", tur.slug)}
              className={qatorKlass(tanlanganTur === tur.slug)}
            >
              <span>{tur.nomi?.[locale] || tur.nomi?.uz}</span>
              {tur.kitoblar_soni !== undefined && (
                <span className="text-[12px] text-muted tabular-nums">{tur.kitoblar_soni}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {bolim(
        t("yonalishlar"),
        <div className="-mx-0.5">
          <button
            type="button"
            onClick={() => updateParam("yonalish", "")}
            className={qatorKlass(!tanlanganYonalish)}
          >
            <span>{t("barchaYonalishlar")}</span>
          </button>
          {yonalishlar.map((yon) => {
            const bolalari = yon.bolalar || [];
            const ochiq = ochiqOta[yon.slug];
            return (
              <div key={yon.slug}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => updateParam("yonalish", yon.slug)}
                    className={`${qatorKlass(tanlanganYonalish === yon.slug)} flex-1 min-w-0`}
                  >
                    <span className="truncate">{yon.nomi?.[locale] || yon.nomi?.uz}</span>
                    <span className="text-[12px] text-muted tabular-nums flex-shrink-0">
                      {yon.kitoblar_soni}
                    </span>
                  </button>
                  {bolalari.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOchiqOta((p) => ({ ...p, [yon.slug]: !p[yon.slug] }))}
                      aria-label={yon.nomi?.[locale] || yon.nomi?.uz}
                      aria-expanded={!!ochiq}
                      className="p-1.5 text-muted hover:text-ink transition-colors"
                    >
                      <ChevronDown
                        size={15}
                        className={`transition-transform ${ochiq ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>

                {bolalari.length > 0 && ochiq && (
                  <div className="ml-3 pl-2 border-l border-line">
                    {bolalari.map((bola) => (
                      <button
                        key={bola.slug}
                        type="button"
                        onClick={() => updateParam("yonalish", bola.slug)}
                        className={qatorKlass(tanlanganYonalish === bola.slug)}
                      >
                        <span className="truncate">{bola.nomi?.[locale] || bola.nomi?.uz}</span>
                        <span className="text-[12px] text-muted tabular-nums">
                          {bola.kitoblar_soni}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {bolim(
        t("kitobTili"),
        <div className="flex flex-wrap gap-1 px-2.5">
          {[
            { kod: "", nom: t("barchasi") },
            { kod: "uz", nom: "UZ" },
            { kod: "ru", nom: "RU" },
            { kod: "en", nom: "EN" },
          ].map((item) => (
            <button
              key={item.kod}
              type="button"
              onClick={() => updateParam("til", item.kod)}
              className={`h-9 px-3 rounded-lg text-[13px] transition-colors ${
                tanlanganTil === item.kod
                  ? "bg-brand text-on-brand"
                  : "bg-surface-2 text-ink-2 hover:text-ink"
              }`}
            >
              {item.nom}
            </button>
          ))}
        </div>
      )}

      {bolim(
        t("nashrYili"),
        <div className="px-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder={t("yilDan")}
              aria-label={t("yilDan")}
              value={yilDan}
              onChange={(e) => setYilDan(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg bg-surface border border-line-2 text-[14px] text-ink focus:outline-none focus:border-brand transition-colors"
            />
            <span className="text-muted">–</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder={t("yilGacha")}
              aria-label={t("yilGacha")}
              value={yilGacha}
              onChange={(e) => setYilGacha(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg bg-surface border border-line-2 text-[14px] text-ink focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={yilQollash}
            className="w-full h-9 rounded-lg bg-surface-2 hover:bg-line text-ink-2 hover:text-ink text-[13px] font-medium transition-colors"
          >
            {t("yilQollash")}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobil: filtrlarni ochish */}
      <button
        type="button"
        onClick={() => setDrawerOchiq(true)}
        className="lg:hidden w-full h-11 px-4 rounded-xl bg-surface border border-line-2 text-ink-2 text-[14px] font-medium flex items-center justify-center gap-2 transition-colors hover:border-brand hover:text-brand"
      >
        <SlidersHorizontal size={16} strokeWidth={1.75} />
        <span>{t("filtrlar")}</span>
        {faolSoni > 0 && (
          <span className="px-1.5 rounded-full bg-brand text-on-brand text-[12px] tabular-nums">
            {faolSoni}
          </span>
        )}
      </button>

      {drawerOchiq && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setDrawerOchiq(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          <div className="relative ml-auto w-full max-w-sm bg-surface h-full flex flex-col border-l border-line">
            <div className="h-16 px-4 border-b border-line flex items-center justify-between flex-shrink-0">
              <h2 className="font-display text-[18px] text-ink">{t("filtrlar")}</h2>
              <button
                type="button"
                onClick={() => setDrawerOchiq(false)}
                aria-label={t("tozalash")}
                className="w-9 h-9 rounded-lg text-ink-2 hover:bg-surface-2 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">{filtrlar}</div>

            <div className="p-4 border-t border-line flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  tozalash();
                  setDrawerOchiq(false);
                }}
                className="h-11 px-4 rounded-xl border border-line-2 text-ink-2 text-[14px] transition-colors hover:text-ink"
              >
                {t("tozalash")}
              </button>
              <button
                type="button"
                onClick={() => setDrawerOchiq(false)}
                className="flex-1 h-11 rounded-xl bg-brand hover:bg-brand-strong text-on-brand text-[14px] font-semibold transition-colors"
              >
                {t("natijalarniKorish")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="flex items-baseline justify-between mb-5 px-2.5">
          <h2 className="text-[13px] font-semibold text-ink">{t("filtrlar")}</h2>
          {faolSoni > 0 && (
            <button
              type="button"
              onClick={tozalash}
              className="text-[13px] text-muted hover:text-brand transition-colors"
            >
              {t("tozalash")}
            </button>
          )}
        </div>
        {filtrlar}
      </div>
    </>
  );
}
