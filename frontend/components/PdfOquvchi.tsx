"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";

interface PdfOquvchiProps {
  url: string;
  /** Serverdan ma'lum bo'lsa, yuklanishdan oldin sahifa sonini ko'rsatish uchun. */
  sahifalarSoni?: number | null;
}

const ZOOM_QADAM = 0.2;
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 3;

export default function PdfOquvchi({ url, sahifalarSoni }: PdfOquvchiProps) {
  const t = useTranslations("oquvchi");

  const [jami, setJami] = useState(sahifalarSoni ?? 0);
  // URL hash'i o'qilgan sahifani saqlaydi: sahifani yangilaganda yoki
  // havolani ulashganda o'sha joydan davom etiladi.
  const [sahifa, setSahifa] = useState(() => {
    if (typeof window === "undefined") return 1;
    const raqam = parseInt(window.location.hash.replace("#", ""), 10);
    return Number.isFinite(raqam) && raqam > 0 ? raqam : 1;
  });
  const [zoom, setZoom] = useState(1);
  const [holat, setHolat] = useState<"yuklanmoqda" | "tayyor" | "xato">("yuklanmoqda");

  const hujjatRef = useRef<PDFDocumentProxy | null>(null);
  // Hujjatni bo'shatish loadingTask orqali bo'ladi (PDFDocumentProxy'da destroy yo'q).
  const yuklashRef = useRef<PDFDocumentLoadingTask | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maydonRef = useRef<HTMLDivElement>(null);
  const chizishRef = useRef<RenderTask | null>(null);
  // Har chizish navbatini raqamlaymiz: kech tugagan eski navbat
  // yangi sahifaning ustiga chizib qo'ymasligi uchun.
  const navbatRef = useRef(0);

  // --- Hujjatni ochish -----------------------------------------------------
  useEffect(() => {
    let bekor = false;

    (async () => {
      setHolat("yuklanmoqda");
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const yuklash = pdfjs.getDocument({ url });
        yuklashRef.current = yuklash;
        const hujjat = await yuklash.promise;
        if (bekor) {
          yuklash.destroy();
          return;
        }
        hujjatRef.current = hujjat;
        setJami(hujjat.numPages);
        setSahifa((joriy) => Math.min(Math.max(joriy, 1), hujjat.numPages));
        setHolat("tayyor");
      } catch {
        if (!bekor) setHolat("xato");
      }
    })();

    return () => {
      bekor = true;
      chizishRef.current?.cancel();
      yuklashRef.current?.destroy();
      yuklashRef.current = null;
      hujjatRef.current = null;
    };
  }, [url]);

  // --- Joriy sahifani chizish ---------------------------------------------
  const chizish = useCallback(async () => {
    const hujjat = hujjatRef.current;
    const canvas = canvasRef.current;
    const maydon = maydonRef.current;
    if (!hujjat || !canvas || !maydon) return;

    const navbat = ++navbatRef.current;
    chizishRef.current?.cancel();

    const page = await hujjat.getPage(sahifa);
    if (navbat !== navbatRef.current) return;

    // Butun sahifa ko'rinib tursin: balandlikka moslab, keyin zoom qo'llanadi.
    const asl = page.getViewport({ scale: 1 });
    const boyMaydon = maydon.clientHeight - 32;
    const enMaydon = maydon.clientWidth - 32;
    const moslash = Math.min(boyMaydon / asl.height, enMaydon / asl.width);
    const viewport = page.getViewport({ scale: moslash * zoom });

    // Retina ekranlarda matn aniq bo'lishi uchun piksel zichligiga ko'paytiramiz.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const task = page.render({ canvas, canvasContext: ctx, viewport });
    chizishRef.current = task;
    try {
      await task.promise;
    } catch {
      // cancel() qilingan navbat — bu kutilgan holat, e'tiborsiz qoldiriladi.
    }
  }, [sahifa, zoom]);

  useEffect(() => {
    if (holat === "tayyor") chizish();
  }, [holat, chizish]);

  useEffect(() => {
    if (holat !== "tayyor") return;
    window.history.replaceState(null, "", `#${sahifa}`);
  }, [sahifa, holat]);

  // Oyna o'lchami o'zgarsa qayta moslashtirish
  useEffect(() => {
    const maydon = maydonRef.current;
    if (!maydon || holat !== "tayyor") return;
    const kuzatuvchi = new ResizeObserver(() => chizish());
    kuzatuvchi.observe(maydon);
    return () => kuzatuvchi.disconnect();
  }, [holat, chizish]);

  // --- Varaqlash -----------------------------------------------------------
  const otish = useCallback(
    (raqam: number) => {
      setSahifa((joriy) => {
        const yangi = Math.min(Math.max(raqam, 1), jami || 1);
        return yangi === joriy ? joriy : yangi;
      });
    },
    [jami]
  );

  useEffect(() => {
    const klaviatura = (e: KeyboardEvent) => {
      const nishon = e.target as HTMLElement | null;
      if (nishon && (nishon.tagName === "INPUT" || nishon.tagName === "TEXTAREA")) return;

      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        otish(sahifa + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        otish(sahifa - 1);
      } else if (e.key === "Home") {
        otish(1);
      } else if (e.key === "End") {
        otish(jami);
      }
    };
    window.addEventListener("keydown", klaviatura);
    return () => window.removeEventListener("keydown", klaviatura);
  }, [sahifa, jami, otish]);

  const birinchi = sahifa <= 1;
  const oxirgi = jami > 0 && sahifa >= jami;

  const yonTugma =
    "w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white " +
    "disabled:opacity-0 disabled:pointer-events-none flex items-center " +
    "justify-center transition-colors backdrop-blur-sm flex-shrink-0";

  return (
    <div className="h-full flex flex-col">
      {/* Sahifa maydoni */}
      <div className="flex-1 min-h-0 flex items-center gap-2 sm:gap-4 px-2 sm:px-4">
        <button
          type="button"
          onClick={() => otish(sahifa - 1)}
          disabled={birinchi || holat !== "tayyor"}
          aria-label={t("oldingiSahifa")}
          className={`hidden sm:flex ${yonTugma}`}
        >
          <ChevronLeft size={22} />
        </button>

        <div
          ref={maydonRef}
          className="flex-1 h-full min-w-0 flex items-center justify-center overflow-hidden"
        >
          {holat === "yuklanmoqda" && (
            <p className="text-white/50 text-[14px]">{t("yuklanmoqda")}…</p>
          )}
          {holat === "xato" && <p className="text-white/70 text-[14px]">{t("xato")}</p>}
          <canvas
            ref={canvasRef}
            className={`rounded-sm shadow-[0_8px_40px_rgba(0,0,0,.5)] bg-white ${
              holat === "tayyor" ? "" : "hidden"
            }`}
          />
        </div>

        <button
          type="button"
          onClick={() => otish(sahifa + 1)}
          disabled={oxirgi || holat !== "tayyor"}
          aria-label={t("keyingiSahifa")}
          className={`hidden sm:flex ${yonTugma}`}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Pastki boshqaruv paneli */}
      <div className="flex-shrink-0 h-14 px-3 sm:px-5 flex items-center justify-center gap-2 sm:gap-5 border-t border-white/10">
        <button
          type="button"
          onClick={() => otish(sahifa - 1)}
          disabled={birinchi || holat !== "tayyor"}
          aria-label={t("oldingiSahifa")}
          className="sm:hidden w-10 h-10 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2 text-white/70 text-[13px] tabular-nums">
          <label htmlFor="sahifa-raqami" className="sr-only">
            {t("sahifagaOtish")}
          </label>
          <input
            id="sahifa-raqami"
            type="number"
            min={1}
            max={jami || 1}
            value={sahifa}
            onChange={(e) => {
              const raqam = parseInt(e.target.value, 10);
              if (!Number.isNaN(raqam)) otish(raqam);
            }}
            disabled={holat !== "tayyor"}
            className="w-14 h-9 px-2 rounded-lg bg-white/10 text-white text-center focus:outline-none focus:ring-1 focus:ring-white/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span>/ {jami || "—"}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_QADAM))}
            disabled={zoom <= ZOOM_MIN || holat !== "tayyor"}
            aria-label={t("kichiklashtirish")}
            className="w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 flex items-center justify-center transition-colors"
          >
            <Minus size={17} />
          </button>
          <span className="w-12 text-center text-white/50 text-[13px] tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_QADAM))}
            disabled={zoom >= ZOOM_MAX || holat !== "tayyor"}
            aria-label={t("kattalashtirish")}
            className="w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 flex items-center justify-center transition-colors"
          >
            <Plus size={17} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => otish(sahifa + 1)}
          disabled={oxirgi || holat !== "tayyor"}
          aria-label={t("keyingiSahifa")}
          className="sm:hidden w-10 h-10 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 flex items-center justify-center transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
