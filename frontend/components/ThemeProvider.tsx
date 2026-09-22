"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({
  children,
  initialTheme = "light",
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  // Sync theme on mount if client localStorage has an explicitly saved preference
  useEffect(() => {
    try {
      const savedLocal = localStorage.getItem("theme") as Theme | null;
      const cookieMatch = document.cookie.match(/(?:^|;\s*)theme=([^;]+)/);
      const savedCookie = cookieMatch ? (cookieMatch[1] as Theme) : null;
      const effectiveTheme = savedLocal || savedCookie || initialTheme;

      if (effectiveTheme === "dark" || effectiveTheme === "light") {
        if (effectiveTheme !== theme) {
          queueMicrotask(() => setTheme(effectiveTheme));
        }
        if (effectiveTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        if (savedCookie !== effectiveTheme) {
          document.cookie = `theme=${effectiveTheme}; path=/; max-age=31536000; SameSite=Lax`;
        }
      }
    } catch {
      // Ignore in restricted environments
    }
  }, [initialTheme, theme]);

  // Ensure <html> always has the right class whenever state changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
      document.cookie = `theme=${next}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore
    }
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
