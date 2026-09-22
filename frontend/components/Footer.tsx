import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer className="w-full bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 pt-16 pb-12 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-200 dark:border-slate-800 text-left">
          {/* 1. Brand & Description */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-700 dark:bg-sky-600 flex items-center justify-center text-white shadow-md">
                <span className="material-symbols-outlined text-[24px]">
                  local_library
                </span>
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">
                Kutubxona<span className="text-teal-600 dark:text-teal-400">.AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t("tavsif")}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-slate-900 text-[11px] font-semibold text-teal-800 dark:text-emerald-400 border border-teal-100 dark:border-slate-800 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t("bepulFond")}</span>
            </div>
          </div>

          {/* 2. Tezkor havolalar */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              {t("tezkorHavolalar")}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/"
                  className="text-slate-600 dark:text-slate-400 hover:text-sky-800 dark:hover:text-teal-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    chevron_right
                  </span>
                  <span>{tNav("boshSahifa")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/katalog"
                  className="text-slate-600 dark:text-slate-400 hover:text-sky-800 dark:hover:text-teal-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    chevron_right
                  </span>
                  <span>{tNav("katalog")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/katalog?turi=darslik"
                  className="text-slate-600 dark:text-slate-400 hover:text-sky-800 dark:hover:text-teal-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    chevron_right
                  </span>
                  <span>{t("darsliklar")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/katalog?saralash=-korishlar_soni"
                  className="text-slate-600 dark:text-slate-400 hover:text-sky-800 dark:hover:text-teal-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    chevron_right
                  </span>
                  <span>{t("ommabop")}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Manzil va Kontaktlar */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              {t("manzilSarlavha")}
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-[18px] flex-shrink-0 mt-0.5">
                  location_on
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {t("manzil")}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-[18px] flex-shrink-0">
                  call
                </span>
                <div className="flex flex-col">
                  <a
                    href="tel:+998712000000"
                    className="text-slate-700 dark:text-slate-300 hover:text-sky-800 dark:hover:text-white transition-colors font-medium"
                  >
                    {t("telefon")}
                  </a>
                  <a
                    href="tel:+998712441234"
                    className="text-slate-500 dark:text-slate-500 hover:text-sky-800 dark:hover:text-white transition-colors"
                  >
                    {t("qoshimchaTelefon")}
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-[18px] flex-shrink-0">
                  mail
                </span>
                <a
                  href="mailto:kutubxona@tibbiyot.uz"
                  className="text-slate-700 dark:text-slate-300 hover:text-sky-800 dark:hover:text-white transition-colors font-medium"
                >
                  {t("email")}
                </a>
              </li>
            </ul>
          </div>

          {/* 4. Ish vaqti va Ijtimoiy tarmoqlar */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              {t("ishVaqtiSarlavha")}
            </h4>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-[18px]">
                  schedule
                </span>
                <span>{t("ishVaqti")}</span>
              </div>
              <p className="text-slate-500 pl-6">{t("yakshanba")}</p>
            </div>

            <h5 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              {t("ijtimoiyTarmoqlar")}
            </h5>
            <div className="flex items-center gap-2.5">
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-sky-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-sky-700 dark:text-sky-400 border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[18px]">
                  send
                </span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-pink-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-pink-700 dark:text-pink-400 border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[18px]">
                  photo_camera
                </span>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-red-700 dark:text-red-400 border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[18px]">
                  smart_display
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Elektron Kutubxona. {t("huquqlar")}</p>
          <span className="text-slate-400 dark:text-slate-600 text-[11px]">
            Tibbiy va klinik ta'lim uchun ochiq portal
          </span>
        </div>
      </div>
    </footer>
  );
}
