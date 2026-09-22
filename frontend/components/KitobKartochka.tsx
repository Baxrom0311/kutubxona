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
    <div className="group bg-white dark:bg-slate-850 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Cover Container (3:4 ratio) */}
        <Link
          href={`/kitob/${kitob.slug}`}
          className="relative block w-full aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-sky-50 dark:from-slate-800 dark:to-slate-900 shadow-inner mb-3"
        >
          {kitob.muqova ? (
            <Image
              src={kitob.muqova}
              alt={kitob.nomi}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl text-sky-400 dark:text-sky-500 mb-2">
                menu_book
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 line-clamp-3">
                {kitob.nomi}
              </span>
            </div>
          )}

          {/* Formats badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {kitob.formatlar &&
              kitob.formatlar.map((fmt) => (
                <span
                  key={fmt}
                  className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-900/80 backdrop-blur-sm text-white shadow-sm"
                >
                  {fmt}
                </span>
              ))}
          </div>

          {/* Specialty tag */}
          <div className="absolute bottom-2 left-2 right-2">
            <span className="inline-block max-w-full px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-900/85 dark:bg-slate-900/90 backdrop-blur-sm text-sky-100 truncate shadow-sm">
              {yonalishNomi}
            </span>
          </div>
        </Link>

        {/* Title */}
        <Link href={`/kitob/${kitob.slug}`}>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2 hover:text-sky-700 dark:hover:text-teal-400 transition-colors mb-1">
            {kitob.nomi}
          </h3>
        </Link>

        {/* Author */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
          {mualliflarMatni}
        </p>
      </div>

      {/* Meta Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          {kitob.yil && <span>{kitob.yil}</span>}
          <span className="uppercase font-semibold text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
            {kitob.til}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <span className="material-symbols-outlined text-[15px]">visibility</span>
          <span>{kitob.korishlar_soni || 0}</span>
        </div>
      </div>

      {/* Action Button */}
      <Link
        href={`/kitob/${kitob.slug}`}
        className="mt-3 w-full py-2 rounded-xl bg-sky-50 dark:bg-slate-800 group-hover:bg-sky-700 dark:group-hover:bg-teal-600 text-sky-800 dark:text-sky-300 group-hover:text-white text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5"
      >
        <span className="material-symbols-outlined text-[16px]">menu_book</span>
        <span>{t("mutolaaQilish")}</span>
      </Link>
    </div>
  );
}
