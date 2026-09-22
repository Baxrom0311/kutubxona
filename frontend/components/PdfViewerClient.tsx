"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface PdfViewerClientProps {
  url: string;
  format: "pdf" | "epub";
}

export default function PdfViewerClient({ url, format }: PdfViewerClientProps) {
  const t = useTranslations("oquvchi");
  const [fullscreen, setFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setFullscreen(false);
      }
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900">
      {/* Document View */}
      {format === "pdf" ? (
        <iframe
          src={`${url}#toolbar=1&navpanes=0`}
          className="w-full h-full border-0 bg-slate-900"
          title="PDF O'quvchi"
        />
      ) : (
        <div className="text-center p-8 text-slate-300 max-w-md bg-slate-800/80 rounded-2xl border border-slate-700">
          <span className="material-symbols-outlined text-5xl text-teal-400 mb-4">
            menu_book
          </span>
          <h3 className="font-bold text-lg text-white mb-2">{t("epubSarlavha")}</h3>
          <p className="text-xs text-slate-400 mb-6">
            {t("epubTavsif")}
          </p>
          <a
            href={url}
            download
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>{t("epubYuklabOlish")}</span>
          </a>
        </div>
      )}

      {/* Floating Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        type="button"
        title={t("tolikEkran")}
        className="absolute bottom-4 right-4 p-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700 shadow-xl transition-all"
      >
        <span className="material-symbols-outlined text-[20px]">
          {fullscreen ? "fullscreen_exit" : "fullscreen"}
        </span>
      </button>
    </div>
  );
}
