"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AiChatWidget from "./AiChatWidget";

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [aiChatOpen, setAiChatOpen] = useState(false);

  return (
    <>
      <Navbar onOpenAiChat={() => setAiChatOpen(true)} />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
      <AiChatWidget
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        onToggle={() => setAiChatOpen((prev) => !prev)}
      />
    </>
  );
}
