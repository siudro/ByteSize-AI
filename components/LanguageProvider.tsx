"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ARABIC_VARIANT,
  DEFAULT_LANGUAGE,
  dirForLanguage,
  htmlLangForLanguage,
  isArabicVariantCode,
  isLanguageCode
} from "@/lib/i18n";
import type { ArabicVariantCode, LanguageCode } from "@/lib/schema";

type LanguageContextValue = {
  language: LanguageCode;
  arabicVariant: ArabicVariantCode;
  direction: "rtl" | "ltr";
  setLanguage: (language: LanguageCode) => void;
  setArabicVariant: (variant: ArabicVariantCode) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const LANGUAGE_STORAGE_KEY = "bytesize-ai-language-v2";
const ARABIC_VARIANT_STORAGE_KEY = "bytesize-ai-arabic-variant-v1";

function applyDocumentLanguage(language: LanguageCode, arabicVariant: ArabicVariantCode) {
  document.documentElement.lang = htmlLangForLanguage(language, arabicVariant);
  document.documentElement.dir = dirForLanguage(language);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [arabicVariant, setArabicVariantState] = useState<ArabicVariantCode>(DEFAULT_ARABIC_VARIANT);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const storedArabicVariant = window.localStorage.getItem(ARABIC_VARIANT_STORAGE_KEY);

    const nextLanguage = isLanguageCode(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;
    const nextArabicVariant = isArabicVariantCode(storedArabicVariant) ? storedArabicVariant : DEFAULT_ARABIC_VARIANT;

    setLanguageState(nextLanguage);
    setArabicVariantState(nextArabicVariant);
    applyDocumentLanguage(nextLanguage, nextArabicVariant);
  }, []);

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    applyDocumentLanguage(nextLanguage, arabicVariant);
  };

  const setArabicVariant = (nextArabicVariant: ArabicVariantCode) => {
    setArabicVariantState(nextArabicVariant);
    setLanguageState("ar");
    window.localStorage.setItem(ARABIC_VARIANT_STORAGE_KEY, nextArabicVariant);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "ar");
    applyDocumentLanguage("ar", nextArabicVariant);
  };

  const value = useMemo(
    () => ({
      language,
      arabicVariant,
      direction: dirForLanguage(language),
      setLanguage,
      setArabicVariant
    }),
    [arabicVariant, language]
  );

  useEffect(() => {
    applyDocumentLanguage(language, arabicVariant);
  }, [arabicVariant, language]);

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
  const { language, arabicVariant, setLanguage, setArabicVariant } = useLanguage();
  const [arabicMenuOpen, setArabicMenuOpen] = useState(false);
  const isArabic = language === "ar";

  function chooseArabicVariant(nextVariant: ArabicVariantCode) {
    setArabicVariant(nextVariant);
    setArabicMenuOpen(false);
  }

  return (
    <div className="language-toggle" role="group" aria-label={isArabic ? "اللغة ونمط العربية" : "Language"}>
      <div className="language-control">
        <div
          className="language-arabic-wrap"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setArabicMenuOpen(false);
            }
          }}
        >
          <button
            aria-expanded={arabicMenuOpen}
            aria-haspopup="menu"
            aria-pressed={isArabic}
            className="language-choice language-choice-arabic"
            type="button"
            onClick={() => {
              setLanguage("ar");
              setArabicMenuOpen((open) => !open);
            }}
          >
            <span>العربية</span>
            <span className="language-chevron" aria-hidden="true" />
          </button>

          {arabicMenuOpen ? (
            <div className="arabic-variant-menu" role="menu" aria-label="نمط العربية">
              <button
                aria-checked={isArabic && arabicVariant === "saudi"}
                className="arabic-variant-menu-item"
                role="menuitemradio"
                type="button"
                onClick={() => chooseArabicVariant("saudi")}
              >
                عامية
              </button>

              <button
                aria-checked={isArabic && arabicVariant === "standard"}
                className="arabic-variant-menu-item"
                role="menuitemradio"
                type="button"
                onClick={() => chooseArabicVariant("standard")}
              >
                فصحى
              </button>
            </div>
          ) : null}
        </div>

        <button
          aria-pressed={language === "en"}
          className="language-choice"
          type="button"
          onClick={() => {
            setLanguage("en");
            setArabicMenuOpen(false);
          }}
        >
          English
        </button>
      </div>
    </div>
  );
}
