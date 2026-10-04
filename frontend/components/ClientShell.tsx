"use client";

import { useState, useEffect } from "react";
import { usePathname } from "@/i18n/routing";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AiChatWidget from "./AiChatWidget";
import { ThemeProvider } from "./ThemeProvider";

export default function ClientShell({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: "light" | "dark";
}) {
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const pathname = usePathname();

  // O'qish oynasi butun ekranni egallaydi — menyu va footer yashiriladi.
  // AI maslahatchi esa kitob o'qiyotganda savol berish uchun ham kerak.
  const oqishRejimi = pathname.includes("/oqish/");
  const kioskRejimi = pathname.includes("/kiosk");

  useEffect(() => {
    const handleOpenAi = () => setAiChatOpen(true);
    window.addEventListener("open-ai-chat", handleOpenAi);
    return () => window.removeEventListener("open-ai-chat", handleOpenAi);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch((err) => {
            console.error("Service worker registration failed:", err);
          });
      });
    }
  }, []);

  if (kioskRejimi) {
    return (
      <ThemeProvider initialTheme={initialTheme}>
        {children}
      </ThemeProvider>
    );
  }

  if (oqishRejimi) {
    return (
      <ThemeProvider initialTheme={initialTheme}>
        {children}
        <AiChatWidget
          isOpen={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          onToggle={() => setAiChatOpen((prev) => !prev)}
          readerMode
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
      <AiChatWidget
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        onToggle={() => setAiChatOpen((prev) => !prev)}
      />
    </ThemeProvider>
  );
}
