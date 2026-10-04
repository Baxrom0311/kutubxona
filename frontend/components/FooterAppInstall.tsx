"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Download, Laptop } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function subscribeToPwa(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("appinstalled", callback);
  window.addEventListener("pwa-installed", callback);
  window.addEventListener("pwa-prompt-ready", callback);
  const mq = window.matchMedia("(display-mode: standalone)");
  if (mq.addEventListener) {
    mq.addEventListener("change", callback);
  }
  return () => {
    window.removeEventListener("appinstalled", callback);
    window.removeEventListener("pwa-installed", callback);
    window.removeEventListener("pwa-prompt-ready", callback);
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
  return true;
}

export default function FooterAppInstall() {
  const t = useTranslations("footer");

  const isPwaMode = useSyncExternalStore(subscribeToPwa, getPwaSnapshot, getServerSnapshot);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("pwa-installed", handleInstalled);
    return () => {
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("pwa-installed", handleInstalled);
    };
  }, []);

  // PWA rejimida bo'lsa yoki o'rnatilgan bo'lsa — ko'rsatilmaydi
  if (isPwaMode || installed) {
    return null;
  }

  const handleInstallClick = async () => {
    const win = window as unknown as { __pwaInstallPrompt?: BeforeInstallPromptEvent | null };
    const prompt = win.__pwaInstallPrompt;
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice?.outcome === "accepted") {
        win.__pwaInstallPrompt = null;
        setInstalled(true);
      }
    }
  };

  return (
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
  );
}
