"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLanguage } from "./LanguageProvider";

export type StimulusMode = "low" | "standard" | "high";

type ExperienceContextValue = {
  stimulusMode: StimulusMode;
  setStimulusMode: (mode: StimulusMode) => void;
  fontScale: number;
  increaseFontScale: () => void;
  decreaseFontScale: () => void;
  resetFontScale: () => void;
};

const STIMULUS_STORAGE_KEY = "bytesize-ai-stimulus-v1";
const FONT_SCALE_STORAGE_KEY = "bytesize-ai-font-scale-v1";
const FONT_SCALES = [0.9, 1, 1.1, 1.2] as const;
const DEFAULT_STIMULUS_MODE: StimulusMode = "standard";
const DEFAULT_FONT_SCALE = 1;

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

function isStimulusMode(value: string | null): value is StimulusMode {
  return value === "low" || value === "standard" || value === "high";
}

function nearestFontScale(value: number) {
  return FONT_SCALES.reduce((nearest, scale) =>
    Math.abs(scale - value) < Math.abs(nearest - value) ? scale : nearest
  );
}

function readCookie(key: string) {
  if (typeof document === "undefined") return null;
  const item = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));
  return item ? decodeURIComponent(item.slice(key.length + 1)) : null;
}

function readStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key) ?? readCookie(key);
  } catch {
    return readCookie(key);
  }
}

function writeStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Some embedded browser contexts restrict localStorage; cookies keep the UI preference stable there.
  }
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
}

function applyExperience(stimulusMode: StimulusMode, fontScale: number) {
  document.documentElement.dataset.stimulus = stimulusMode;
  document.documentElement.style.setProperty("--font-scale", String(fontScale));
}

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const [stimulusMode, setStimulusModeState] = useState<StimulusMode>(DEFAULT_STIMULUS_MODE);
  const [fontScale, setFontScale] = useState<number>(DEFAULT_FONT_SCALE);

  useEffect(() => {
    const storedStimulus = readStoredValue(STIMULUS_STORAGE_KEY);
    const storedFontScale = Number(readStoredValue(FONT_SCALE_STORAGE_KEY));

    const nextStimulus = isStimulusMode(storedStimulus) ? storedStimulus : DEFAULT_STIMULUS_MODE;
    const nextFontScale = Number.isFinite(storedFontScale) ? nearestFontScale(storedFontScale) : DEFAULT_FONT_SCALE;

    setStimulusModeState(nextStimulus);
    setFontScale(nextFontScale);
    applyExperience(nextStimulus, nextFontScale);
  }, []);

  useEffect(() => {
    applyExperience(stimulusMode, fontScale);
  }, [stimulusMode, fontScale]);

  const value = useMemo<ExperienceContextValue>(() => {
    const setStoredFontScale = (nextScale: number) => {
      const safeScale = nearestFontScale(nextScale);
      setFontScale(safeScale);
      applyExperience(stimulusMode, safeScale);
      writeStoredValue(FONT_SCALE_STORAGE_KEY, String(safeScale));
    };

    return {
      stimulusMode,
      setStimulusMode(mode) {
        setStimulusModeState(mode);
        applyExperience(mode, fontScale);
        writeStoredValue(STIMULUS_STORAGE_KEY, mode);
      },
      fontScale,
      increaseFontScale() {
        const index = FONT_SCALES.indexOf(nearestFontScale(fontScale));
        setStoredFontScale(FONT_SCALES[Math.min(FONT_SCALES.length - 1, index + 1)]);
      },
      decreaseFontScale() {
        const index = FONT_SCALES.indexOf(nearestFontScale(fontScale));
        setStoredFontScale(FONT_SCALES[Math.max(0, index - 1)]);
      },
      resetFontScale() {
        setStoredFontScale(DEFAULT_FONT_SCALE);
      }
    };
  }, [fontScale, stimulusMode]);

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperience must be used within ExperienceProvider");
  }
  return context;
}

const STIMULUS_LABELS: Record<StimulusMode, { ar: string; en: string }> = {
  low: { ar: "هادئ", en: "Low" },
  standard: { ar: "متوازن", en: "Standard" },
  high: { ar: "حيوي", en: "High" }
};

export function ExperienceControls() {
  const { language } = useLanguage();
  const { stimulusMode, setStimulusMode, fontScale, increaseFontScale, decreaseFontScale, resetFontScale } =
    useExperience();
  const modes: StimulusMode[] = ["low", "standard", "high"];

  return (
    <div className="experience-controls">
      <div
        className="segmented-control"
        role="group"
        aria-label={language === "ar" ? "مستوى التحفيز البصري" : "Visual stimulus level"}
      >
        {modes.map((mode) => (
          <button
            aria-pressed={stimulusMode === mode}
            className="segmented-button"
            key={mode}
            type="button"
            onClick={() => setStimulusMode(mode)}
          >
            {language === "ar" ? STIMULUS_LABELS[mode].ar : STIMULUS_LABELS[mode].en}
          </button>
        ))}
      </div>

      <div className="text-size-control" role="group" aria-label={language === "ar" ? "حجم النص" : "Text size"}>
        <button
          className="icon-button"
          type="button"
          aria-label={language === "ar" ? "تصغير النص" : "Decrease text size"}
          title={language === "ar" ? "تصغير النص" : "Decrease text size"}
          onClick={decreaseFontScale}
          disabled={fontScale <= FONT_SCALES[0]}
        >
          A-
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={language === "ar" ? "إعادة حجم النص" : "Reset text size"}
          title={language === "ar" ? "إعادة حجم النص" : "Reset text size"}
          onClick={resetFontScale}
        >
          A
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={language === "ar" ? "تكبير النص" : "Increase text size"}
          title={language === "ar" ? "تكبير النص" : "Increase text size"}
          onClick={increaseFontScale}
          disabled={fontScale >= FONT_SCALES[FONT_SCALES.length - 1]}
        >
          A+
        </button>
      </div>
    </div>
  );
}
