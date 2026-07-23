import type { ArabicVariantCode, LanguageCode, LocalizedField, LocalizedText } from "./schema";

export const DEFAULT_LANGUAGE: LanguageCode = "ar";
export const FALLBACK_LANGUAGE: LanguageCode = "ar";
export const DEFAULT_ARABIC_VARIANT: ArabicVariantCode = "saudi";
export const FALLBACK_ARABIC_VARIANT: ArabicVariantCode = "saudi";

export function isLocalizedText(value: LocalizedField): value is LocalizedText {
  return Boolean(value && typeof value === "object" && ("ar" in value || "ar_fusha" in value || "en" in value));
}

export function isLanguageCode(value: string | null): value is LanguageCode {
  return value === "ar" || value === "en";
}

export function isArabicVariantCode(value: string | null): value is ArabicVariantCode {
  return value === "saudi" || value === "standard";
}

export function t(
  value: LocalizedField,
  language: LanguageCode = DEFAULT_LANGUAGE,
  arabicVariant: ArabicVariantCode = DEFAULT_ARABIC_VARIANT
): string {
  if (!value) return "";
  if (typeof value === "string") return value;

  if (language === "en") {
    return value.en ?? value.ar ?? value.ar_fusha ?? "";
  }

  if (arabicVariant === "standard") {
    return value.ar_fusha ?? value.ar ?? value.en ?? "";
  }

  return value.ar ?? value.ar_fusha ?? value.en ?? "";
}

export function dirForLanguage(language: LanguageCode): "rtl" | "ltr" {
  return language === "ar" ? "rtl" : "ltr";
}

export function htmlLangForLanguage(language: LanguageCode, arabicVariant: ArabicVariantCode): string {
  if (language === "en") return "en";
  return arabicVariant === "standard" ? "ar" : "ar-SA";
}
