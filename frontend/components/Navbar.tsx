"use client";

import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

interface NavbarProps {
  onOpenAiChat?: () => void;
}

export default function Navbar({ onOpenAiChat }: NavbarProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as "uz" | "ru" | "en";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <header className="fixed top-0 w-full z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-sky-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">local_library</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-sky-900 tracking-tight leading-tight">
              Kutubxona<span className="text-teal-600">.AI</span>
            </span>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
              Elektron Kutubxona
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full">
          <Link
            href="/"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              pathname === "/"
                ? "bg-sky-800 text-white shadow-sm"
                : "text-slate-600 hover:text-sky-900 hover:bg-white/60"
            }`}
          >
            {t("boshSahifa")}
          </Link>
          <Link
            href="/katalog"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              pathname.startsWith("/katalog")
                ? "bg-sky-800 text-white shadow-sm"
                : "text-slate-600 hover:text-sky-900 hover:bg-white/60"
            }`}
          >
            {t("katalog")}
          </Link>
          <button
            onClick={onOpenAiChat}
            type="button"
            className="px-4 py-2 rounded-full text-sm font-medium text-teal-700 hover:text-teal-900 hover:bg-teal-50 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px] text-teal-600">auto_awesome</span>
            <span>AI Maslahatchi</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200/60">
            <span className="material-symbols-outlined text-[18px] text-slate-500 mr-1">language</span>
            <select
              value={locale}
              onChange={handleLanguageChange}
              aria-label="Tilni tanlash"
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="uz">UZ</option>
              <option value="ru">RU</option>
              <option value="en">EN</option>
            </select>
          </div>

          {/* AI Trigger button */}
          <button
            onClick={onOpenAiChat}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-sky-800 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span>AI Yordamchi</span>
          </button>

          {/* Admin Link */}
          <a
            href="http://127.0.0.1:8001/admin/"
            target="_blank"
            rel="noopener noreferrer"
            title="Kutubxonachi Admin"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[19px]">admin_panel_settings</span>
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            aria-label="Menyu"
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-3 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-sm font-medium text-slate-700 hover:text-sky-800"
          >
            {t("boshSahifa")}
          </Link>
          <Link
            href="/katalog"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-sm font-medium text-slate-700 hover:text-sky-800"
          >
            {t("katalog")}
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAiChat?.();
            }}
            className="py-2 text-sm font-medium text-teal-700 flex items-center gap-2 text-left"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>AI Maslahatchi</span>
          </button>
        </div>
      )}
    </header>
  );
}
