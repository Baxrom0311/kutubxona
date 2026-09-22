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

  return (
    <div className="w-full bg-white dark:bg-slate-850 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-sky-900 dark:text-sky-300">
          <span className="material-symbols-outlined text-[22px]">tune</span>
          <h2 className="font-bold text-lg">{t("filtrlar")}</h2>
        </div>
        <button
          onClick={tozalash}
          type="button"
          className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline transition-colors"
        >
          {t("tozalash")}
        </button>
      </div>

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
          className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors mt-1"
        >
          {t("yilQollash")}
        </button>
      </div>
    </div>
  );
}
