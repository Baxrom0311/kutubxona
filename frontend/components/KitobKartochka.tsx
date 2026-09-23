"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Kitob } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

interface KitobKartochkaProps {
  kitob: Kitob;
}

export default function KitobKartochka({ kitob }: KitobKartochkaProps) {
  const locale = useLocale() as "uz" | "ru" | "en";
  const t = useTranslations("kitob");

  const mualliflarMatni =
    kitob.mualliflar && kitob.mualliflar.length > 0
      ? kitob.mualliflar.join(", ")
      : t("muallifYoq");

  const turNomi = kitob.turi?.nomi?.[locale] || kitob.turi?.nomi?.uz || "";
  const yonalishNomi =
    kitob.yonalishlar && kitob.yonalishlar.length > 0
      ? kitob.yonalishlar[0]?.nomi?.[locale] || kitob.yonalishlar[0]?.nomi?.uz
      : turNomi;

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Cover Container (3:4 ratio) */}
        <Link
          href={`/kitob/${kitob.slug}`}
          className="relative block w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner mb-2.5 sm:mb-3 border border-slate-100 dark:border-slate-800/80"
        >
          {kitob.muqova ? (
            <Image
              src={kitob.muqova}
              alt={kitob.nomi}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-slate-400 dark:text-slate-500">
              <span className="material-symbols-outlined text-3xl sm:text-4xl text-sky-500 dark:text-sky-400 mb-1.5">
                menu_book
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 line-clamp-3">
                {kitob.nomi}
              </span>
            </div>
          )}

          {/* Formats badges */}
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex gap-1">
            {kitob.formatlar &&
              kitob.formatlar.map((fmt) => (
                <span
                  key={fmt}
                  className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase bg-slate-900/80 backdrop-blur-sm text-white shadow-xs"
                >
                  {fmt}
                </span>
              ))}
          </div>

          {/* Specialty tag */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2 sm:left-2 sm:right-2">
            <span className="inline-block max-w-full px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-sky-900/90 dark:bg-slate-950/90 backdrop-blur-sm text-sky-100 truncate shadow-xs">
              {yonalishNomi}
            </span>
          </div>
        </Link>

        {/* Title */}
        <Link href={`/kitob/${kitob.slug}`}>
          <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm md:text-base leading-snug line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] hover:text-sky-700 dark:hover:text-teal-400 transition-colors mb-1">
            {kitob.nomi}
          </h3>
        </Link>

        {/* Author */}
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
          {mualliflarMatni}
        </p>
      </div>

      {/* Meta Footer */}
      <div className="pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {kitob.yil && <span>{kitob.yil}</span>}
          {kitob.til && (
            <span className="font-semibold text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
              {t(`tillar.${kitob.til}`) || kitob.til.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <span className="material-symbols-outlined text-[13px] sm:text-[15px]">visibility</span>
          <span>{kitob.korishlar_soni || 0}</span>
        </div>
      </div>

      {/* Action Button */}
      <Link
        href={`/kitob/${kitob.slug}`}
        className="mt-2.5 sm:mt-3 w-full py-1.5 sm:py-2 rounded-xl bg-sky-50 dark:bg-slate-800 hover:bg-sky-800 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white text-sky-800 dark:text-teal-300 text-[11px] sm:text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 border border-sky-100 dark:border-slate-700"
      >
        <span className="material-symbols-outlined text-[15px] sm:text-[16px]">menu_book</span>
        <span>{t("mutolaaQilish")}</span>
      </Link>
    </div>
  );
}
