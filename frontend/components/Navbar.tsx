"use client";

import { useState } from "react";
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

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as "uz" | "ru" | "en";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <header className="fixed top-0 w-full z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-colors">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-sky-700 dark:bg-sky-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">local_library</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-sky-900 dark:text-sky-300 tracking-tight leading-tight">
              Kutubxona<span className="text-teal-600 dark:text-teal-400">.AI</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
              Malaka Oshirish Portali
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800 p-1.5 rounded-full">
          <Link
            href="/"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              pathname === "/"
                ? "bg-sky-800 dark:bg-sky-700 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-sky-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700"
            }`}
          >
            {t("boshSahifa")}
          </Link>
          <Link
            href="/katalog"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              pathname.startsWith("/katalog")
                ? "bg-sky-800 dark:bg-sky-700 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-sky-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700"
            }`}
          >
            {t("katalog")}
          </Link>
          <button
            onClick={onOpenAiChat}
            type="button"
            className="px-4 py-2 rounded-full text-sm font-medium text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px] text-teal-600 dark:text-teal-400">auto_awesome</span>
            <span>{t("aiMaslahatchi")}</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400 mr-1">language</span>
            <select
              value={locale}
              onChange={handleLanguageChange}
              aria-label={t("til")}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="uz" className="dark:bg-slate-800">O'zbek</option>
              <option value="ru" className="dark:bg-slate-800">Русский</option>
              <option value="en" className="dark:bg-slate-800">English</option>
            </select>
          </div>

          {/* Theme Toggle Button (Dark / Light) */}
          <button
            onClick={toggleTheme}
            type="button"
            aria-label={theme === "dark" ? t("yorug") : t("qorongu")}
            title={theme === "dark" ? t("yorug") : t("qorongu")}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-amber-400 flex items-center justify-center transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* AI Trigger button */}
          <button
            onClick={onOpenAiChat}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-sky-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span>{t("aiMaslahatchi")}</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            aria-label="Menyu"
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col gap-3 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-sky-800 dark:hover:text-teal-400"
          >
            {t("boshSahifa")}
          </Link>
          <Link
            href="/katalog"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-sky-800 dark:hover:text-teal-400"
          >
            {t("katalog")}
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAiChat?.();
            }}
            className="py-2 text-sm font-medium text-teal-700 dark:text-teal-400 flex items-center gap-2 text-left"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>{t("aiMaslahatchi")}</span>
          </button>
        </div>
      )}
    </header>
  );
}
