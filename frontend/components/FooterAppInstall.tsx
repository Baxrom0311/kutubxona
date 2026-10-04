"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Download, Laptop, Monitor, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function subscribeToPwa(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("appinstalled", callback);
  const mq = window.matchMedia("(display-mode: standalone)");
  if (mq.addEventListener) {
    mq.addEventListener("change", callback);
  }
  return () => {
    window.removeEventListener("appinstalled", callback);
    if (mq.removeEventListener) {
      mq.removeEventListener("change", callback);
    }
  };
}

function getPwaSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  const isDisplayStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const urlParams = new URLSearchParams(window.location.search);
  const isPwaParam = urlParams.get("source") === "pwa";
  return isDisplayStandalone || isIosStandalone || isPwaParam;
}

function getServerSnapshot(): boolean {
  return true; // SSR paytida miltillashni oldini olish uchun yashirin turadi
}

export default function FooterAppInstall() {
  const t = useTranslations("footer");
  const tPwa = useTranslations("pwa");

  const isPwaMode = useSyncExternalStore(subscribeToPwa, getPwaSnapshot, getServerSnapshot);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [installedManually, setInstalledManually] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // PWA dan foydalanganda yoki endi o'rnatilganda chiqmaydi
  if (isPwaMode || installedManually) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        setInstalledManually(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="mt-4 pt-3 border-t border-line/60">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
            <Laptop size={15} strokeWidth={2} />
          </div>
          <span className="text-[13px] font-semibold text-ink">
            {t("appniOrnating")}
          </span>
        </div>
        <p className="text-[12px] text-muted leading-snug mb-3">
          {t("appTavsifi")}
        </p>
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-brand hover:bg-brand-strong text-white text-[13px] font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Download size={14} strokeWidth={2} />
          <span>{t("ornatishTugmasi")}</span>
        </button>
      </div>

      {/* Safari / qo'lda o'rnatish yo'riqnomasi */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface border border-line rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-ink p-1 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer"
              aria-label={tPwa("yopish")}
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                <Monitor size={22} />
              </div>
              <h3 className="font-display font-semibold text-lg text-ink">
                {tPwa("sarlavha")}
              </h3>
            </div>

            <p className="text-[14px] text-muted leading-relaxed mb-5">
              {tPwa("tavsif")}
            </p>

            <div className="space-y-3 bg-surface-2/60 rounded-xl p-3.5 border border-line text-[13px] text-ink mb-6">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-brand min-w-[18px]">1.</span>
                <span>{tPwa("chromeQollanma")}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-brand min-w-[18px]">2.</span>
                <span>{tPwa("safariQollanma")}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-brand text-white font-medium text-[14px] hover:opacity-90 transition-opacity cursor-pointer"
            >
              {tPwa("yopish")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
