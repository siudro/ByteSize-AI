import type { LanguageCode, LocalizedField, LocalizedText } from "./schema";

export const DEFAULT_LANGUAGE: LanguageCode = "ar";
export const FALLBACK_LANGUAGE: LanguageCode = "ar";

export function isLocalizedText(value: LocalizedField): value is LocalizedText {
  return Boolean(value && typeof value === "object" && ("ar" in value || "en" in value));
}

export function t(value: LocalizedField, language: LanguageCode = DEFAULT_LANGUAGE): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] ?? value[FALLBACK_LANGUAGE] ?? value.en ?? "";
}

export function dirForLanguage(language: LanguageCode): "rtl" | "ltr" {
  return language === "ar" ? "rtl" : "ltr";
}
