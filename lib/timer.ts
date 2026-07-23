import type { LocalizedText } from "./schema";

export type TimerStimulusMode = "low" | "standard" | "high";
export type TimerAlertIntensity = "none" | "soft" | "standard" | "high";

export type TimerAlertSettings = {
  visual?: boolean;
  audio?: boolean;
  intensity?: TimerAlertIntensity;
  message?: LocalizedText;
};

export type TimerAlertConfig = TimerAlertSettings & {
  stimulus?: Partial<Record<TimerStimulusMode, TimerAlertSettings>>;
};

export type TimerConfig = {
  duration_seconds: number;
  completion_required?: boolean;
  completion_feedback?: LocalizedText;
  alert?: TimerAlertConfig;
};

const DEFAULT_ALERTS: Record<TimerStimulusMode, Required<Pick<TimerAlertSettings, "visual" | "audio" | "intensity">>> = {
  low: { visual: true, audio: false, intensity: "soft" },
  standard: { visual: true, audio: true, intensity: "standard" },
  high: { visual: true, audio: true, intensity: "high" }
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function positiveInteger(value: unknown): number | undefined {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number <= 0) return undefined;
  return Math.floor(number);
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function intensityValue(value: unknown): TimerAlertIntensity | undefined {
  return value === "none" || value === "soft" || value === "standard" || value === "high" ? value : undefined;
}

function localizedTextValue(value: unknown): LocalizedText | undefined {
  return isRecord(value) ? (value as LocalizedText) : undefined;
}

function alertSettingsFromRecord(value: unknown): TimerAlertSettings {
  if (!isRecord(value)) return {};

  return {
    visual: booleanValue(value.visual),
    audio: booleanValue(value.audio),
    intensity: intensityValue(value.intensity),
    message: localizedTextValue(value.message)
  };
}

function alertConfigFromRecord(value: unknown): TimerAlertConfig | undefined {
  if (!isRecord(value)) return undefined;

  const stimulusRecord = isRecord(value.stimulus) ? value.stimulus : null;
  const stimulus = stimulusRecord
    ? (Object.fromEntries(
        (["low", "standard", "high"] as const).map((mode) => [mode, alertSettingsFromRecord(stimulusRecord[mode])])
      ) as TimerAlertConfig["stimulus"])
    : undefined;

  return {
    ...alertSettingsFromRecord(value),
    stimulus
  };
}

export function normalizeTimerConfig(source: unknown, fallbackDurationSeconds?: unknown): TimerConfig | null {
  const record = isRecord(source) ? source : {};
  const durationSeconds = positiveInteger(record.duration_seconds) ?? positiveInteger(fallbackDurationSeconds);

  if (!durationSeconds) return null;

  return {
    duration_seconds: durationSeconds,
    completion_required: booleanValue(record.completion_required) ?? true,
    completion_feedback: localizedTextValue(record.completion_feedback),
    alert: alertConfigFromRecord(record.alert)
  };
}

export function resolveTimerAlert(alert: TimerAlertConfig | undefined, stimulusMode: TimerStimulusMode): TimerAlertSettings {
  const stimulusAlert = alert?.stimulus?.[stimulusMode] ?? {};

  return {
    ...DEFAULT_ALERTS[stimulusMode],
    visual: alert?.visual ?? stimulusAlert.visual ?? DEFAULT_ALERTS[stimulusMode].visual,
    audio: alert?.audio ?? stimulusAlert.audio ?? DEFAULT_ALERTS[stimulusMode].audio,
    intensity: alert?.intensity ?? stimulusAlert.intensity ?? DEFAULT_ALERTS[stimulusMode].intensity,
    message: alert?.message ?? stimulusAlert.message
  };
}

export function formatTimerTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
