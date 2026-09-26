"use client";

import { Link } from "@/i18n/routing";
import Muqova from "./Muqova";
import { Kitob } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

interface KitobKartochkaProps {
  kitob: Kitob;
  priority?: boolean;
}

export default function KitobKartochka({ kitob, priority }: KitobKartochkaProps) {
  const locale = useLocale() as "uz" | "ru" | "en";
  const t = useTranslations("kitob");

  const mualliflarMatni =
    kitob.mualliflar && kitob.mualliflar.length > 0
      ? kitob.mualliflar.join(", ")
      : t("muallifYoq");

  const yonalishNomi =
    kitob.yonalishlar?.[0]?.nomi?.[locale] ||
    kitob.yonalishlar?.[0]?.nomi?.uz ||
    kitob.turi?.nomi?.[locale] ||
    kitob.turi?.nomi?.uz ||
    "";

  // Bosma kitobda qarzga berilganlari ayirilgan bo'sh nusxalar ko'rsatiladi,
  // shunda foydalanuvchi kutubxonaga borishdan oldin biladi.
  const bosmaKitob = !kitob.oqish_mumkin;
  const jamiNusxa = kitob.nusxalar_soni ?? 1;
  const boshNusxa = kitob.bosh_nusxalar_soni ?? jamiNusxa;
  const hammasiBand = bosmaKitob && boshNusxa <= 0;

  return (
    <Link href={`/kitob/${kitob.slug}`} className="group block">
      {/* Muqova — kartochkaning asosiy elementi */}
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface-2 shadow-soft group-hover:shadow-lift transition-shadow duration-300">
        <Muqova
          slug={kitob.slug}
          nomi={kitob.nomi}
          muqova={kitob.muqova}
          muallif={mualliflarMatni}
          priority={priority}
          sizes="(max-width: 640px) 44vw, (max-width: 1024px) 28vw, 200px"
        />

        {/* Yorliqlar doim yuqori o'ng burchakda: yasalgan muqovada nom
            tepada, muallif pastda turadi va ularning ustiga tushmaydi. */}
        {bosmaKitob ? (
          // Yorliq qisqa bo'lishi shart — muqovadagi nom bilan to'qnashmasin.
          // To'liq izoh muqova ostidagi qatorda so'z bilan yoziladi.
          <span
            title={hammasiBand ? t("bandBelgi") : t("boshNusxalar")}
            className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-white text-[10px] font-semibold tabular-nums backdrop-blur-sm ${
              hammasiBand ? "bg-amber-700/85" : "bg-black/55"
            }`}
          >
            {boshNusxa}/{jamiNusxa}
          </span>
        ) : (
          kitob.formatlar?.length > 0 && (
            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/45 text-white text-[10px] font-semibold tracking-wide backdrop-blur-sm">
              {kitob.formatlar[0].toUpperCase()}
            </span>
          )
        )}
      </div>

      <div className="pt-3">
        {/* Muqova yasalgan bo'lsa, nomi allaqachon muqovada turadi —
            uni ikkinchi marta takrorlamaymiz. */}
        {kitob.muqova ? (
          <h3 className="font-display text-[15px] leading-snug text-ink line-clamp-2 group-hover:text-brand transition-colors">
            {kitob.nomi}
          </h3>
        ) : null}
        <p className="text-[13px] text-muted line-clamp-1">{mualliflarMatni}</p>
        <p className="mt-1.5 text-[12px] text-muted/80">
          {yonalishNomi}
          {kitob.yil ? `, ${kitob.yil}` : ""}
          {bosmaKitob && (
            <span className={hammasiBand ? "text-muted font-medium" : "text-brand font-medium"}>
              {" · "}
              {hammasiBand
                ? t("bandBelgi")
                : `${t("bosmaBelgi")} ${boshNusxa}/${jamiNusxa}`}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
