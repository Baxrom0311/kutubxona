import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer className="w-full bg-slate-900 dark:bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800 text-left">
          {/* 1. Brand & Description */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md">
                <span className="material-symbols-outlined text-[24px]">local_library</span>
              </div>
              <span className="font-bold text-xl text-white">
                Kutubxona<span className="text-teal-400">.AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t("tavsif")}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 text-[11px] font-semibold text-emerald-400 border border-slate-700/60 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t("bepulFond")}</span>
            </div>
          </div>

          {/* 2. Tezkor havolalar */}
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">
              {t("tezkorHavolalar")}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                  <span>{tNav("boshSahifa")}</span>
                </Link>
              </li>
              <li>
                <Link href="/katalog" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                  <span>{tNav("katalog")}</span>
                </Link>
              </li>
              <li>
                <Link href="/katalog?turi=darslik" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                  <span>{t("darsliklar")}</span>
                </Link>
              </li>
              <li>
                <Link href="/katalog?saralash=-korishlar_soni" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                  <span>{t("ommabop")}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Manzil va Kontaktlar */}
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">
              {t("manzilSarlavha")}
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-teal-400 text-[18px] flex-shrink-0 mt-0.5">
                  location_on
                </span>
                <span>{t("manzil")}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-teal-400 text-[18px] flex-shrink-0">
                  call
                </span>
                <div className="flex flex-col">
                  <a href="tel:+998712000000" className="hover:text-white transition-colors">
                    {t("telefon")}
                  </a>
                  <a href="tel:+998712441234" className="hover:text-white transition-colors text-slate-500">
                    {t("qoshimchaTelefon")}
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-teal-400 text-[18px] flex-shrink-0">
                  mail
                </span>
                <a href="mailto:kutubxona@tibbiyot.uz" className="hover:text-white transition-colors">
                  {t("email")}
                </a>
              </li>
            </ul>
          </div>

          {/* 4. Ish vaqti va Ijtimoiy tarmoqlar */}
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">
              {t("ishVaqtiSarlavha")}
            </h4>
            <div className="space-y-2 text-xs text-slate-400 mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-400 text-[18px]">schedule</span>
                <span>{t("ishVaqti")}</span>
              </div>
              <p className="text-slate-500 pl-6">{t("yakshanba")}</p>
            </div>

            <h5 className="font-bold text-xs text-white uppercase tracking-wider mb-3">
              {t("ijtimoiyTarmoqlar")}
            </h5>
            <div className="flex items-center gap-2.5">
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-pink-600 text-white flex items-center justify-center transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[18px]">smart_display</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Elektron Kutubxona. {t("huquqlar")}</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Toshkent, O'zbekiston</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
