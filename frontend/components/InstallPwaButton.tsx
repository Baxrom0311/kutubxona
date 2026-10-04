"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Monitor, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallPwaButton() {
  const t = useTranslations("pwa");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if already in standalone desktop/mobile mode
    const checkStandalone = () => {
      const isDisplayStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isIosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      return isDisplayStandalone || isIosStandalone;
    };

    setIsStandalone(checkStandalone());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setIsModalOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!mounted || isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title={t("dasturniOrnatish")}
        aria-label={t("dasturniOrnatish")}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-brand hover:bg-brand/10 transition-colors border border-brand/20 cursor-pointer"
      >
        <Download size={15} strokeWidth={2} className="flex-shrink-0" />
        <span className="hidden sm:inline">{t("ornatish")}</span>
      </button>

      {/* Modal yo'riqnoma (Agar brauzer to'g'ridan-to'g'ri prompt bermasa, masalan Safari yoki avval yopilgan bo'lsa) */}
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
              className="absolute top-4 right-4 text-muted hover:text-ink p-1 rounded-lg hover:bg-surface-2 transition-colors"
              aria-label={t("yopish")}
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                <Monitor size={22} />
              </div>
              <h3 className="font-display font-semibold text-lg text-ink">
                {t("sarlavha")}
              </h3>
            </div>

            <p className="text-[14px] text-muted leading-relaxed mb-5">
              {t("tavsif")}
            </p>

            <div className="space-y-3 bg-surface-2/60 rounded-xl p-3.5 border border-line text-[13px] text-ink mb-6">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-brand min-w-[18px]">1.</span>
                <span>{t("chromeQollanma")}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-brand min-w-[18px]">2.</span>
                <span>{t("safariQollanma")}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-brand text-white font-medium text-[14px] hover:opacity-90 transition-opacity"
            >
              {t("yopish")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
