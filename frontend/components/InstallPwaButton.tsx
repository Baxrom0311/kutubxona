"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";

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

export default function InstallPwaButton() {
  const t = useTranslations("pwa");
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
  );
}
