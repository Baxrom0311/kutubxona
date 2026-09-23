import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import Logotip from "./Logotip";
import { Mail, MapPin, Phone, Send } from "lucide-react";

const MAPS_URL = "https://maps.app.goo.gl/gDrA4TofaJpohw2s8";

/* lucide-react 1.x brend ikonkalarini tashlab yuborgan, shuning uchun
   Instagram va YouTube belgilari shu yerda — bir xil 24px to'r va
   1.75 chiziq qalinligida, qolgan ikonkalarga mos. */
const ikonka = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function TelegramIcon() {
  return <Send size={18} strokeWidth={1.75} aria-hidden="true" />;
}

function InstagramIcon() {
  return (
    <svg {...ikonka}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg {...ikonka}>
      <rect x="2" y="5" width="20" height="14" rx="4.5" />
      <path d="M10.2 9.3 15 12l-4.8 2.7V9.3Z" />
    </svg>
  );
}

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  const ijtimoiy = [
    { href: "https://t.me", nom: "Telegram", Icon: TelegramIcon },
    { href: "https://instagram.com", nom: "Instagram", Icon: InstagramIcon },
    { href: "https://youtube.com", nom: "YouTube", Icon: YoutubeIcon },
  ];

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
                  href="mailto:kutubxona@tibbiyot.uz"
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
              {ijtimoiy.map(({ href, nom, Icon }) => (
                <a
                  key={nom}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={nom}
                  className="w-9 h-9 rounded-lg text-muted hover:text-brand hover:bg-surface-2 flex items-center justify-center transition-colors"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-12 pt-6 border-t border-line text-[13px] text-muted">
          © {new Date().getFullYear()} Kutubxona
        </p>
      </div>
    </footer>
  );
}
