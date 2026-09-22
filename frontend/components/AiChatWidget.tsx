"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";

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

export default function AiChatWidget({
  isOpen,
  onClose,
  onToggle,
}: AiChatWidgetProps) {
  const [xabarlar, setXabarlar] = useState<Xabar[]>([
    {
      rol: "assistant",
      matn: "Assalomu alaykum! Men kutubxonaning aqlli AI maslahatchisiman. Qaysi soha yoki mavzu bo'yicha darslik qidiryapsiz? Sizga kutubxonadagi eng yaxshi kitoblarni topib bera olaman.",
    },
  ]);
  const [kirishMatni, setKirishMatni] = useState("");
  const [yuklanmoqda, setYuklanmoqda] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const xabarlarOxiriRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    xabarlarOxiriRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [xabarlar, yuklanmoqda]);

  const xabarYuborish = async (matn: string) => {
    if (!matn.trim() || yuklanmoqda) return;

    const userXabar: Xabar = { rol: "user", matn };
    setXabarlar((prev) => [...prev, userXabar]);
    setKirishMatni("");
    setYuklanmoqda(true);

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";
      const res = await fetch(`${apiBase}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xabar: matn,
          session_id: sessionId || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session_id) setSessionId(data.session_id);
        const aiXabar: Xabar = {
          rol: "assistant",
          matn: data.javob,
          tavsiyalar: data.tavsiya_etilgan_kitoblar || [],
        };
        setXabarlar((prev) => [...prev, aiXabar]);
      } else {
        setXabarlar((prev) => [
          ...prev,
          {
            rol: "assistant",
            matn: "Kechirasiz, sun'iy intellekt xizmati bilan vaqtincha aloqa uzildi. Qayta urinib ko'ring.",
          },
        ]);
      }
    } catch {
      setXabarlar((prev) => [
        ...prev,
        {
          rol: "assistant",
          matn: "Aloqa xatosi. Iltimos, server ishlayotganini tekshiring.",
        },
      ]);
    } finally {
      setYuklanmoqda(false);
    }
  };

  const tezkorTakliflar = [
    "Kardiologiya bo'yicha kitoblar",
    "Anatomiya va EKG tahlili",
    "Yangi qo'shilgan darsliklar",
  ];

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      <button
        onClick={onToggle}
        type="button"
        aria-label="AI Maslahatchi"
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-teal-600 hover:bg-sky-700 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-2 group"
      >
        <span className="material-symbols-outlined text-[26px]">smart_toy</span>
        <span className="hidden sm:inline-block font-semibold text-sm pr-1">
          AI Maslahatchi
        </span>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
      </button>

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-900 to-teal-800 text-white flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-teal-300 text-[24px]">
                auto_awesome
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Kutubxona AI Maslahatchisi
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-teal-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span>DeepSeek AI • Onlayn</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50">
          {/* Quick starter chips */}
          <div className="mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Tezkor so'rovlar:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {tezkorTakliflar.map((taklif) => (
                <button
                  key={taklif}
                  onClick={() => xabarYuborish(taklif)}
                  type="button"
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-xs text-slate-600 transition-all text-left shadow-2xs"
                >
                  {taklif}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation */}
          {xabarlar.map((x, i) => (
            <div
              key={i}
              className={`flex flex-col ${
                x.rol === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  x.rol === "user"
                    ? "bg-sky-700 text-white rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                }`}
              >
                <p className="whitespace-pre-wrap">{x.matn}</p>

                {/* Recommended books */}
                {x.tavsiyalar && x.tavsiyalar.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block mb-1.5">
                      Tavsiya etilgan kitoblar:
                    </span>
                    <div className="space-y-1.5">
                      {x.tavsiyalar.map((t) => (
                        <Link
                          key={t.slug}
                          href={`/kitob/${t.slug}`}
                          onClick={onClose}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-100 text-slate-800 hover:text-teal-900 transition-colors group"
                        >
                          <span className="text-xs font-semibold truncate pr-2">
                            {t.nomi}
                          </span>
                          <span className="material-symbols-outlined text-[16px] text-teal-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                            arrow_forward
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {yuklanmoqda && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
              <span>AI javob tayyorlamoqda...</span>
            </div>
          )}

          <div ref={xabarlarOxiriRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              xabarYuborish(kirishMatni);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={kirishMatni}
              onChange={(e) => setKirishMatni(e.target.value)}
              placeholder="Kitob yoki mavzu bo'yicha savol bering..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!kirishMatni.trim() || yuklanmoqda}
              className="p-3 rounded-xl bg-teal-700 hover:bg-sky-800 disabled:opacity-50 text-white transition-colors flex items-center justify-center flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">
                send
              </span>
            </button>
          </form>
          <span className="text-[10px] text-slate-400 text-center block mt-2">
            AI javoblari rasmiy kutubxona katalogi asosida beriladi
          </span>
        </div>
      </div>
    </>
  );
}
