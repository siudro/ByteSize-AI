import type { ArabicVariantCode, InternalVisualization, LanguageCode, ScreenInteraction } from "@/lib/schema";

export type InteractionState = Record<string, unknown>;

export type InteractionComponentProps = {
  language: LanguageCode;
  arabicVariant: ArabicVariantCode;
  direction: "rtl" | "ltr";
  config: Record<string, unknown>;
  stage?: string;
  savedState: InteractionState;
  interaction?: ScreenInteraction;
  visualization?: InternalVisualization;
  onStateChange: (state: InteractionState) => void;
  onComplete: (state?: InteractionState) => void;
};

export function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}