"use client";

import { useState, useEffect } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "./ThemeProvider";

interface NavbarProps {
  onOpenAiChat?: () => void;
}

export default function Navbar({ onOpenAiChat }: NavbarProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as "uz" | "ru" | "en";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs transition-colors duration-200">
        <div className="h-16 sm:h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-800 dark:bg-sky-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px] sm:text-[24px]">local_library</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-xl text-slate-900 dark:text-white tracking-tight leading-tight font-display">
                Kutubxona
              </span>
              <span className="hidden xs:block text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                Malaka Oshirish Portali
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (Center Pills - Clean navigation links only, NO duplicate AI button) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
            <Link
              href="/"
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                pathname === "/"
                  ? "bg-sky-800 dark:bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700"
              }`}
            >
              {t("boshSahifa")}
            </Link>
            <Link
              href="/katalog"
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                pathname.startsWith("/katalog")
                  ? "bg-sky-800 dark:bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700"
              }`}
            >
              {t("katalog")}
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-slate-500 dark:text-slate-400 mr-1 pointer-events-none">
                language
              </span>
              <select
                value={locale}
                onChange={handleLanguageChange}
                aria-label={t("til")}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="uz" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">O'zbek</option>
                <option value="ru" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Русский</option>
                <option value="en" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">English</option>
              </select>
            </div>

            {/* Theme Toggle Button (Dark / Light) */}
            <button
              onClick={toggleTheme}
              type="button"
              aria-label={theme === "dark" ? t("yorug") : t("qorongu")}
              title={theme === "dark" ? t("yorug") : t("qorongu")}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-amber-400 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              <span className={`material-symbols-outlined text-[18px] sm:text-[20px] transition-transform duration-300 ${theme === "dark" ? "rotate-0" : "-rotate-90"}`}>
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {/* ONLY ONE AI CTA button on the desktop navbar */}
            <button
              onClick={onOpenAiChat}
              type="button"
              className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              <span>{t("aiMaslahatchi")}</span>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Menyu"
              className="md:hidden w-9 h-9 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown & Backdrop */}
        {mobileMenuOpen && (
          <>
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 top-16 sm:top-20 bg-slate-950/40 backdrop-blur-2xs z-30 transition-opacity"
            />
            <div className="md:hidden relative z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col gap-2 shadow-xl animate-fade-in-fast">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-xl text-sm font-semibold transition-colors ${
                  pathname === "/"
                    ? "bg-sky-50 dark:bg-slate-800 text-sky-800 dark:text-sky-300"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {t("boshSahifa")}
              </Link>
              <Link
                href="/katalog"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-xl text-sm font-semibold transition-colors ${
                  pathname.startsWith("/katalog")
                    ? "bg-sky-50 dark:bg-slate-800 text-sky-800 dark:text-sky-300"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {t("katalog")}
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAiChat?.();
                }}
                className="py-2.5 px-3 rounded-xl text-sm font-semibold bg-teal-50 dark:bg-slate-800 text-teal-800 dark:text-teal-300 flex items-center justify-between border border-teal-200/60 dark:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-teal-600 dark:text-teal-400">
                    smart_toy
                  </span>
                  <span>{t("aiMaslahatchi")}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950/60 px-2 py-0.5 rounded-full">
                  Onlayn
                </span>
              </button>
            </div>
          </>
        )}
      </header>
    </>
  );
}
