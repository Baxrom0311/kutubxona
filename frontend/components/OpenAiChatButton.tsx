"use client";

import React from "react";

interface OpenAiChatButtonProps {
  children: React.ReactNode;
  className?: string;
}

export default function OpenAiChatButton({
  children,
  className,
}: OpenAiChatButtonProps) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-ai-chat"));
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
