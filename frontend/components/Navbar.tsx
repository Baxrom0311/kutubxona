"use client";

import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "./ThemeProvider";
import Logotip from "./Logotip";
import { Globe, Menu, Moon, Sun, X } from "lucide-react";

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as "uz" | "ru" | "en";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    const search = searchParams ? searchParams.toString() : "";
    const target = search ? `${pathname}?${search}` : pathname;
    router.replace(target, { locale: nextLocale });
  };

  const havolalar = [
    { href: "/", nom: t("boshSahifa"), faol: pathname === "/" },
    { href: "/katalog", nom: t("katalog"), faol: pathname.startsWith("/katalog") },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 bg-surface/80 backdrop-blur-xl border-b border-line">
      <div className="h-full max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <Logotip size={30} />
          <span className="font-display text-[19px] tracking-tight text-ink">
            Kutubxona
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-7 text-[14px]">
          {havolalar.map((h) => (
            <Link
              key={h.href}
              href={h.href}
              aria-current={h.faol ? "page" : undefined}
              className={`relative py-5 transition-colors ${
                h.faol
                  ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand"
                  : "text-muted hover:text-ink"
              }`}
            >
              {h.nom}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <div className="relative flex items-center text-ink-2 hover:text-ink transition-colors">
            <Globe size={16} strokeWidth={1.75} className="absolute left-2 pointer-events-none" />
            <select
              value={locale}
              onChange={handleLanguageChange}
              aria-label={t("til")}
              className="appearance-none bg-transparent pl-7 pr-2 py-2 text-[13px] font-medium cursor-pointer rounded-lg hover:bg-surface-2 transition-colors"
            >
              <option value="uz">O&apos;zbek</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>

          <button
            onClick={toggleTheme}
            type="button"
            aria-label={theme === "dark" ? t("yorug") : t("qorongu")}
            className="w-9 h-9 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-2 flex items-center justify-center transition-colors"
          >
            {theme === "dark" ? (
              <Sun size={18} strokeWidth={1.75} />
            ) : (
              <Moon size={18} strokeWidth={1.75} />
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            aria-label={t("menyu")}
            aria-expanded={mobileMenuOpen}
            className="sm:hidden w-9 h-9 rounded-lg text-ink-2 hover:bg-surface-2 flex items-center justify-center transition-colors"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden bg-surface border-b border-line px-4 py-2">
          {havolalar.map((h) => (
            <Link
              key={h.href}
              href={h.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-3 text-[15px] ${h.faol ? "text-brand" : "text-ink-2"}`}
            >
              {h.nom}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
