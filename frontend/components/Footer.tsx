import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import Logotip from "./Logotip";
import { Mail, MapPin, Phone, Send } from "lucide-react";

const MAPS_URL = "https://maps.app.goo.gl/gDrA4TofaJpohw2s8";
const TELEGRAM_URL = "https://t.me/bakhromdev";
const EMAIL = "baxromreyimberganov0311@gmail.com";

function TelegramIcon() {
  return <Send size={18} strokeWidth={1.75} aria-hidden="true" />;
}

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer className="mt-auto bg-surface border-t border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2.5 lg:items-start">
            <Logotip size={28} />
            <span className="font-display text-[18px] text-ink">Kutubxona</span>
          </div>

          <nav>
            <h2 className="text-[13px] font-semibold text-ink mb-3">{t("havolalar")}</h2>
            <ul className="space-y-2 text-[14px]">
              <li>
                <Link href="/" className="text-muted hover:text-brand transition-colors">
                  {tNav("boshSahifa")}
                </Link>
              </li>
              <li>
                <Link href="/katalog" className="text-muted hover:text-brand transition-colors">
                  {tNav("katalog")}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-[13px] font-semibold text-ink mb-3">{t("boglanish")}</h2>
            <ul className="space-y-2.5 text-[14px] text-muted">
              <li className="flex gap-2.5">
                <MapPin size={16} strokeWidth={1.75} className="mt-0.5 flex-shrink-0" />
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand transition-colors"
                >
                  {t("manzil")}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Phone size={16} strokeWidth={1.75} className="mt-0.5 flex-shrink-0" />
                <a href="tel:+998712000000" className="hover:text-brand transition-colors">
                  {t("telefon")}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail size={16} strokeWidth={1.75} className="mt-0.5 flex-shrink-0" />
                <a
                  href={`mailto:${EMAIL}`}
                  className="hover:text-brand transition-colors"
                >
                  {t("email")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[13px] font-semibold text-ink mb-3">
              {t("ishVaqtiSarlavha")}
            </h2>
            <p className="text-[14px] text-muted">{t("ishVaqti")}</p>
            <p className="text-[14px] text-muted mt-1">{t("yakshanba")}</p>

            <div className="flex gap-1 mt-5 -ml-2">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="w-9 h-9 rounded-lg text-muted hover:text-brand hover:bg-surface-2 flex items-center justify-center transition-colors"
              >
                <TelegramIcon />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
