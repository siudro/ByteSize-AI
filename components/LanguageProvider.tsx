"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, dirForLanguage } from "@/lib/i18n";
import type { LanguageCode } from "@/lib/schema";

type LanguageContextValue = {
  language: LanguageCode;
  direction: "rtl" | "ltr";
  setLanguage: (language: LanguageCode) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "bytesize-ai-language-v2";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
    document.documentElement.dir = dirForLanguage(nextLanguage);
  };

  const value = useMemo(
    () => ({
      language,
      direction: dirForLanguage(language),
      setLanguage
    }),
    [language]
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dirForLanguage(language);
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="button-row" role="group" aria-label="Language">
      <button
        className={`button ${language === "ar" ? "primary" : ""}`}
        type="button"
        onClick={() => setLanguage("ar")}
      >
        العربية
      </button>
      <button
        className={`button ${language === "en" ? "primary" : ""}`}
        type="button"
        onClick={() => setLanguage("en")}
      >
        English
      </button>
    </div>
  );
}
