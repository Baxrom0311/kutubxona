"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ArrowUp, ChevronRight, Sparkles, X } from "lucide-react";

interface Xabar {
  rol: "user" | "assistant";
  matn: string;
  tavsiyalar?: { slug: string; nomi: string }[];
}

interface AiChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export default function AiChatWidget({ isOpen, onClose, onToggle }: AiChatWidgetProps) {
  const t = useTranslations("ai");

  const [xabarlar, setXabarlar] = useState<Xabar[]>([]);
  const [kirishMatni, setKirishMatni] = useState("");
  const [yuklanmoqda, setYuklanmoqda] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const oxiriRef = useRef<HTMLDivElement>(null);

  const displayXabarlar: Xabar[] = useMemo(
    () => (xabarlar.length === 0 ? [{ rol: "assistant", matn: t("salom") }] : xabarlar),
    [xabarlar, t]
  );

  useEffect(() => {
    oxiriRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayXabarlar, yuklanmoqda]);

  const xabarYuborish = async (matn: string) => {
    if (!matn.trim() || yuklanmoqda) return;

    setXabarlar((prev) => [...prev, { rol: "user", matn }]);
    setKirishMatni("");
    setYuklanmoqda(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";
      const res = await fetch(`${apiBase}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xabar: matn, session_id: sessionId || undefined }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session_id) setSessionId(data.session_id);
        setXabarlar((prev) => [
          ...prev,
          {
            rol: "assistant",
            matn: data.javob,
            tavsiyalar: data.tavsiya_etilgan_kitoblar || [],
          },
        ]);
      } else {
        setXabarlar((prev) => [...prev, { rol: "assistant", matn: t("xato") }]);
      }
    } catch {
      setXabarlar((prev) => [...prev, { rol: "assistant", matn: t("aloqaXatosi") }]);
    } finally {
      setYuklanmoqda(false);
    }
  };

  const takliflar = [t("taklif1"), t("taklif2"), t("taklif3")];

  return (
    <>
      <button
        onClick={onToggle}
        type="button"
        aria-label={t("sarlavha")}
        aria-expanded={isOpen}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-brand hover:bg-brand-strong text-on-brand shadow-lift flex items-center justify-center transition-colors"
      >
        {isOpen ? <X size={22} /> : <Sparkles size={22} strokeWidth={1.75} />}
      </button>

      {isOpen && (
        <>
          <div onClick={onClose} className="sm:hidden fixed inset-0 bg-black/40 z-50" />

          <div className="fixed inset-x-3 bottom-20 sm:inset-x-auto sm:right-5 sm:w-[380px] h-[540px] max-h-[calc(100dvh-110px)] bg-surface border border-line rounded-2xl shadow-lift z-50 flex flex-col overflow-hidden">
            <header className="h-14 px-4 border-b border-line flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Sparkles size={17} strokeWidth={1.75} className="text-brand" />
                <h2 className="font-display text-[16px] text-ink">{t("sarlavha")}</h2>
              </div>
              <button
                onClick={onClose}
                type="button"
                aria-label={t("yopish")}
                className="w-8 h-8 rounded-lg text-muted hover:text-ink hover:bg-surface-2 flex items-center justify-center transition-colors"
              >
                <X size={17} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {displayXabarlar.map((x, i) => (
                <div key={i} className={x.rol === "user" ? "flex justify-end" : ""}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                      x.rol === "user"
                        ? "bg-brand text-on-brand rounded-br-md"
                        : "bg-surface-2 text-ink rounded-bl-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{x.matn}</p>

                    {x.tavsiyalar && x.tavsiyalar.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-line space-y-0.5">
                        <p className="text-[12px] text-muted mb-1.5">{t("tavsiyalar")}</p>
                        {x.tavsiyalar.map((kitob) => (
                          <Link
                            key={kitob.slug}
                            href={`/kitob/${kitob.slug}`}
                            onClick={onClose}
                            className="flex items-center justify-between gap-2 py-1.5 text-[13px] text-brand hover:text-brand-strong transition-colors"
                          >
                            <span className="truncate">{kitob.nomi}</span>
                            <ChevronRight size={14} className="flex-shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {xabarlar.length === 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {takliflar.map((taklif) => (
                    <button
                      key={taklif}
                      onClick={() => xabarYuborish(taklif)}
                      type="button"
                      className="px-3 py-1.5 rounded-full border border-line-2 text-[13px] text-ink-2 hover:border-brand hover:text-brand transition-colors"
                    >
                      {taklif}
                    </button>
                  ))}
                </div>
              )}

              {yuklanmoqda && (
                <p className="text-[13px] text-muted px-1">{t("tayyorlanmoqda")}…</p>
              )}

              <div ref={oxiriRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                xabarYuborish(kirishMatni);
              }}
              className="p-3 border-t border-line flex items-center gap-2 flex-shrink-0"
            >
              <input
                type="text"
                value={kirishMatni}
                onChange={(e) => setKirishMatni(e.target.value)}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                className="flex-1 h-10 px-3.5 rounded-xl bg-surface-2 text-[15px] sm:text-[14px] text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand transition-shadow"
              />
              <button
                type="submit"
                disabled={!kirishMatni.trim() || yuklanmoqda}
                aria-label={t("yuborish")}
                className="w-10 h-10 rounded-xl bg-brand hover:bg-brand-strong disabled:opacity-40 disabled:hover:bg-brand text-on-brand flex items-center justify-center transition-colors flex-shrink-0"
              >
                <ArrowUp size={18} strokeWidth={2.25} />
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
