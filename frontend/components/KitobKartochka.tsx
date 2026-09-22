import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Kitob } from "@/lib/types";

interface KitobKartochkaProps {
  kitob: Kitob;
}

export default function KitobKartochka({ kitob }: KitobKartochkaProps) {
  const mualliflarMatni =
    kitob.mualliflar && kitob.mualliflar.length > 0
      ? kitob.mualliflar.join(", ")
      : "Muallif ko'rsatilmagan";

  const asosiyYonalish =
    kitob.yonalishlar && kitob.yonalishlar.length > 0
      ? kitob.yonalishlar[0].nomi.uz
      : kitob.turi.nomi.uz;

  return (
    <div className="group bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Cover Container (3:4 ratio) */}
        <Link
          href={`/kitob/${kitob.slug}`}
          className="relative block w-full aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-sky-50 shadow-inner mb-3"
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
              <span className="material-symbols-outlined text-4xl text-sky-300 mb-2">
                menu_book
              </span>
              <span className="text-xs font-semibold text-slate-500 line-clamp-3">
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
                  className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-900/75 backdrop-blur-sm text-white shadow-sm"
                >
                  {fmt}
                </span>
              ))}
          </div>

          {/* Specialty tag */}
          <div className="absolute bottom-2 left-2 right-2">
            <span className="inline-block max-w-full px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-900/80 backdrop-blur-sm text-sky-100 truncate shadow-sm">
              {asosiyYonalish}
            </span>
          </div>
        </Link>

        {/* Title */}
        <Link href={`/kitob/${kitob.slug}`}>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 hover:text-sky-700 transition-colors mb-1">
            {kitob.nomi}
          </h3>
        </Link>

        {/* Author */}
        <p className="text-xs text-slate-500 line-clamp-1 mb-2">
          {mualliflarMatni}
        </p>
      </div>

      {/* Meta Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          {kitob.yil && <span>{kitob.yil}</span>}
          <span className="uppercase font-semibold text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
            {kitob.til}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span className="material-symbols-outlined text-[15px]">visibility</span>
          <span>{kitob.korishlar_soni || 0}</span>
        </div>
      </div>

      {/* Action Button */}
      <Link
        href={`/kitob/${kitob.slug}`}
        className="mt-3 w-full py-2 rounded-xl bg-sky-50 group-hover:bg-sky-700 text-sky-800 group-hover:text-white text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5"
      >
        <span className="material-symbols-outlined text-[16px]">menu_book</span>
        <span>Mutolaa qilish</span>
      </Link>
    </div>
  );
}
