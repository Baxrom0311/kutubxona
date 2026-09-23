"use client";

import { useState } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Turi, Yonalish } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

interface FiltrSidebarProps {
  turlar: Turi[];
  yonalishlar: Yonalish[];
}

export default function FiltrSidebar({
  turlar,
  yonalishlar,
}: FiltrSidebarProps) {
  const t = useTranslations("katalog");
  const locale = useLocale() as "uz" | "ru" | "en";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tanlanganTur = searchParams.get("turi") || "";
  const tanlanganYonalish = searchParams.get("yonalish") || "";
  const tanlanganTil = searchParams.get("til") || "";
  const [yilDan, setYilDan] = useState(searchParams.get("yil_dan") || "");
  const [yilGacha, setYilGacha] = useState(searchParams.get("yil_gacha") || "");
  const [ochiqOta, setOchiqOta] = useState<Record<string, boolean>>({});

  const toggleOta = (slug: string) => {
    setOchiqOta((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("sahifa");
    router.push(`${pathname}?${params.toString()}`);
  };

  const tozalash = () => {
    setYilDan("");
    setYilGacha("");
    router.push(pathname);
  };

  const yilFilterQollash = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (yilDan) params.set("yil_dan", yilDan);
    else params.delete("yil_dan");

    if (yilGacha) params.set("yil_gacha", yilGacha);
    else params.delete("yil_gacha");

    params.delete("sahifa");
    router.push(`${pathname}?${params.toString()}`);
  };

  const faolFiltrlarSoni = [
    tanlanganTur,
    tanlanganYonalish,
    tanlanganTil,
    searchParams.get("yil_dan") || searchParams.get("yil_gacha"),
  ].filter(Boolean).length;

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const filterContent = (
    <div className="space-y-6">
      {/* 1. Kitob turi */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("kitobTuri")}
        </label>
        <div className="space-y-1">
          <button
            onClick={() => updateParam("turi", "")}
            type="button"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              !tanlanganTur
                ? "bg-sky-50 dark:bg-sky-900/40 text-sky-900 dark:text-sky-200 font-bold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span>{t("barchasi")}</span>
          </button>
          {turlar.map((tur) => {
            const nomi = tur.nomi?.[locale] || tur.nomi?.uz;
            return (
              <button
                key={tur.slug}
                onClick={() => updateParam("turi", tur.slug)}
                type="button"
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  tanlanganTur === tur.slug
                    ? "bg-sky-50 dark:bg-sky-900/40 text-sky-900 dark:text-sky-200 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span>{nomi}</span>
                {tur.kitoblar_soni !== undefined && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    {tur.kitoblar_soni}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Yo'nalishlar (Ierarxik daraxt) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("yonalishlar")}
        </label>
        <div className="space-y-1">
          <button
            onClick={() => updateParam("yonalish", "")}
            type="button"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              !tanlanganYonalish
                ? "bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span>{t("barchaYonalishlar")}</span>
          </button>
          {yonalishlar.map((yon) => {
            const hasChildren = yon.bolalar && yon.bolalar.length > 0;
            const isOchiq = ochiqOta[yon.slug];
            const isSelected = tanlanganYonalish === yon.slug;
            const nomi = yon.nomi?.[locale] || yon.nomi?.uz;

            return (
              <div key={yon.slug} className="space-y-1">
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                    isSelected
                      ? "bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <button
                    onClick={() => updateParam("yonalish", yon.slug)}
                    type="button"
                    className="flex-1 text-left truncate"
                  >
                    {nomi}
                  </button>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {yon.kitoblar_soni}
                    </span>
                    {hasChildren && (
                      <button
                        onClick={() => toggleOta(yon.slug)}
                        type="button"
                        className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isOchiq ? "expand_less" : "expand_more"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-items */}
                {hasChildren && isOchiq && (
                  <div className="pl-4 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                    {yon.bolalar.map((bola) => {
                      const bolaNomi = bola.nomi?.[locale] || bola.nomi?.uz;
                      return (
                        <button
                          key={bola.slug}
                          onClick={() => updateParam("yonalish", bola.slug)}
                          type="button"
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            tanlanganYonalish === bola.slug
                              ? "bg-teal-100/70 dark:bg-teal-900/50 text-teal-900 dark:text-teal-100 font-bold"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span className="truncate">{bolaNomi}</span>
                          <span className="text-[10px] text-slate-400">
                            {bola.kitoblar_soni}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Tillar */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("kitobTili")}
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { kod: "", nom: t("barchasi") },
            { kod: "uz", nom: "O'zbek" },
            { kod: "ru", nom: "Рус" },
            { kod: "en", nom: "Eng" },
          ].map((item) => (
            <button
              key={item.kod}
              onClick={() => updateParam("til", item.kod)}
              type="button"
              className={`py-2 rounded-xl text-xs font-medium text-center transition-all ${
                tanlanganTil === item.kod
                  ? "bg-sky-800 dark:bg-sky-600 text-white shadow-xs font-bold"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {item.nom}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Nashr yili */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("nashrYili")}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={t("yilDan")}
            value={yilDan}
            onChange={(e) => setYilDan(e.target.value)}
            className="w-1/2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-sky-600"
          />
          <span className="text-slate-400 text-xs">—</span>
          <input
            type="number"
            placeholder={t("yilGacha")}
            value={yilGacha}
            onChange={(e) => setYilGacha(e.target.value)}
            className="w-1/2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-sky-600"
          />
        </div>
        <button
          onClick={yilFilterQollash}
          type="button"
          className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors mt-1"
        >
          {t("yilQollash")}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Mobile Filter Bar Trigger (Visible on screens < lg) */}
      <div className="lg:hidden w-full mb-2">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          type="button"
          className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between text-slate-800 dark:text-slate-100 hover:border-sky-500 dark:hover:border-sky-500 transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            <span className="material-symbols-outlined text-sky-700 dark:text-sky-400 text-[20px]">
              tune
            </span>
            <span>{t("filtrlar")}</span>
            {faolFiltrlarSoni > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-sky-800 dark:bg-sky-600 text-white text-[10px] sm:text-xs font-bold">
                {faolFiltrlarSoni}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
            <span>{t("ochish")}</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </span>
        </button>
      </div>

      {/* 2. Mobile Drawer Modal / Sheet (Slide-over) */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl z-10 animate-fade-in-fast border-l border-slate-200 dark:border-slate-800">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-sky-700 dark:text-sky-400">
                  tune
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {t("filtrlar")}
                </h3>
                {faolFiltrlarSoni > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-800 dark:bg-sky-600 text-white text-xs font-bold">
                    {faolFiltrlarSoni}
                  </span>
                )}
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                type="button"
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Scrollable Filter List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {filterContent}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 bg-white dark:bg-slate-900">
              <button
                onClick={() => {
                  tozalash();
                  setMobileDrawerOpen(false);
                }}
                type="button"
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {t("tozalash")}
              </button>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-sky-800 hover:bg-sky-900 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-bold text-center transition-colors shadow-xs"
              >
                {t("natijalarniKorish")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Desktop Sticky Sidebar Card (Visible only on lg+) */}
      <div className="hidden lg:block w-full bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sky-900 dark:text-sky-300">
            <span className="material-symbols-outlined text-[22px]">tune</span>
            <h2 className="font-bold text-lg">{t("filtrlar")}</h2>
            {faolFiltrlarSoni > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-sky-800 dark:bg-sky-600 text-white text-xs font-bold">
                {faolFiltrlarSoni}
              </span>
            )}
          </div>
          <button
            onClick={tozalash}
            type="button"
            className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline transition-colors"
          >
            {t("tozalash")}
          </button>
        </div>

        {filterContent}
      </div>
    </>
  );
}
