"use client";

import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AiChatWidget from "./AiChatWidget";
import { ThemeProvider } from "./ThemeProvider";

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [aiChatOpen, setAiChatOpen] = useState(false);

  useEffect(() => {
    const handleOpenAi = () => setAiChatOpen(true);
    window.addEventListener("open-ai-chat", handleOpenAi);
    return () => window.removeEventListener("open-ai-chat", handleOpenAi);
  }, []);

  return (
    <ThemeProvider>
      <Navbar />
      <main className="flex-1 pt-16 sm:pt-20">{children}</main>
      <Footer />
      <AiChatWidget
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        onToggle={() => setAiChatOpen((prev) => !prev)}
      />
    </ThemeProvider>
  );
}
