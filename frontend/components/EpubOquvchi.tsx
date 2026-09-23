"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Rendition } from "epubjs";

interface EpubOquvchiProps {
  url: string;
}

export default function EpubOquvchi({ url }: EpubOquvchiProps) {
  const t = useTranslations("oquvchi");

  const [holat, setHolat] = useState<"yuklanmoqda" | "tayyor" | "xato">("yuklanmoqda");
  const [foiz, setFoiz] = useState(0);

  const maydonRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);

  useEffect(() => {
    let bekor = false;
    const maydon = maydonRef.current;
    if (!maydon) return;

    (async () => {
      try {
        const ePub = (await import("epubjs")).default;
        const kitob = ePub(url);

        // spread: "none" — har safar bitta varaq ko'rinadi.
        const rendition = kitob.renderTo(maydon, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          spread: "none",
        });
        if (bekor) return;
        renditionRef.current = rendition;

        rendition.themes.default({
          body: { "font-size": "17px", "line-height": "1.65", color: "#1a1a1a" },
        });

        await rendition.display();
        if (bekor) return;
        setHolat("tayyor");

        // Joylashuvlar fonda hisoblanadi — o'qish darhol boshlanaveradi.
        kitob.locations.generate(1200).then(() => {
          if (bekor) return;
          rendition.on("relocated", (joylashuv: { start: { percentage: number } }) => {
            setFoiz(Math.round((joylashuv.start.percentage || 0) * 100));
          });
        });
      } catch {
        if (!bekor) setHolat("xato");
      }
    })();

    return () => {
      bekor = true;
      renditionRef.current?.destroy();
      renditionRef.current = null;
    };
  }, [url]);

  const keyingi = useCallback(() => renditionRef.current?.next(), []);
  const oldingi = useCallback(() => renditionRef.current?.prev(), []);

  useEffect(() => {
    const klaviatura = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        keyingi();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        oldingi();
      }
    };
    window.addEventListener("keydown", klaviatura);
    return () => window.removeEventListener("keydown", klaviatura);
  }, [keyingi, oldingi]);

  const yonTugma =
    "w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white " +
    "flex items-center justify-center transition-colors backdrop-blur-sm flex-shrink-0";

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-4">
        <button
          type="button"
          onClick={oldingi}
          aria-label={t("oldingiSahifa")}
          className={`hidden sm:flex ${yonTugma}`}
        >
          <ChevronLeft size={22} />
        </button>

        <div className="relative flex-1 h-full min-w-0 max-w-3xl mx-auto bg-white rounded-sm shadow-[0_8px_40px_rgba(0,0,0,.5)] overflow-hidden">
          {holat !== "tayyor" && (
            <p className="absolute inset-0 flex items-center justify-center text-[14px] text-[#666]">
              {holat === "xato" ? t("xato") : `${t("yuklanmoqda")}…`}
            </p>
          )}
          <div ref={maydonRef} className="w-full h-full" />
        </div>

        <button
          type="button"
          onClick={keyingi}
          aria-label={t("keyingiSahifa")}
          className={`hidden sm:flex ${yonTugma}`}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="flex-shrink-0 h-14 px-3 flex items-center justify-center gap-4 border-t border-white/10">
        <button
          type="button"
          onClick={oldingi}
          aria-label={t("oldingiSahifa")}
          className="sm:hidden w-10 h-10 rounded-lg text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-white/60 text-[13px] tabular-nums">{foiz}%</span>

        <button
          type="button"
          onClick={keyingi}
          aria-label={t("keyingiSahifa")}
          className="sm:hidden w-10 h-10 rounded-lg text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
