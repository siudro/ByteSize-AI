"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useExperience } from "./ExperienceProvider";
import { t } from "@/lib/i18n";
import { formatTimerTime, resolveTimerAlert, type TimerConfig } from "@/lib/timer";
import type { ArabicVariantCode, LanguageCode, LocalizedText } from "@/lib/schema";

type TimerStatus = "idle" | "running" | "paused" | "completed";

type TimerInteractionProps = {
  timer: TimerConfig;
  language: LanguageCode;
  arabicVariant: ArabicVariantCode;
  onCompletedChange?: (completed: boolean) => void;
};

const TIMER_LABELS: Record<string, LocalizedText> = {
  label: { ar: "المؤقت", ar_fusha: "المؤقت", en: "Timer" },
  start: { ar: "ابدأ", ar_fusha: "ابدأ", en: "Start" },
  pause: { ar: "إيقاف مؤقت", ar_fusha: "إيقاف مؤقت", en: "Pause" },
  resume: { ar: "تابع", ar_fusha: "استئناف", en: "Resume" },
  reset: { ar: "إعادة ضبط", ar_fusha: "إعادة ضبط", en: "Reset" },
  ready: { ar: "جاهز", ar_fusha: "جاهز", en: "Ready" },
  running: { ar: "المؤقت يعمل", ar_fusha: "المؤقت يعمل", en: "Timer running" },
  paused: { ar: "المؤقت متوقف مؤقتًا", ar_fusha: "المؤقت متوقف مؤقتًا", en: "Timer paused" },
  completed: { ar: "انتهى الوقت", ar_fusha: "انتهى الوقت", en: "Time is up" },
  defaultFeedback: { ar: "انتهت الدقيقة. شارك فكرتك الآن.", ar_fusha: "انتهى الوقت. شارك فكرتك الآن.", en: "Time is up. Share your idea now." },
  remaining: { ar: "الوقت المتبقي", ar_fusha: "الوقت المتبقي", en: "Time remaining" }
};

function playCompletionTone(intensity: string | undefined) {
  if (intensity === "none" || typeof window === "undefined") return;

  try {
    const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextConstructor = window.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) return;

    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const volume = intensity === "high" ? 0.12 : intensity === "soft" ? 0.045 : 0.075;
    const duration = intensity === "high" ? 0.52 : 0.34;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(intensity === "high" ? 740 : 620, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(intensity === "high" ? 980 : 760, context.currentTime + duration);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
    window.setTimeout(() => void context.close(), (duration + 0.1) * 1000);
  } catch {
    // Audio is a progressive alert; the visual completion state remains the reliable fallback.
  }
}

export function TimerInteraction({ timer, language, arabicVariant, onCompletedChange }: TimerInteractionProps) {
  const durationMs = timer.duration_seconds * 1000;
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const targetTimeRef = useRef<number | null>(null);
  const completionAnnouncedRef = useRef(false);
  const onCompletedChangeRef = useRef(onCompletedChange);
  const { stimulusMode } = useExperience();
  const alert = useMemo(() => resolveTimerAlert(timer.alert, stimulusMode), [stimulusMode, timer.alert]);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const remainingPercent = Math.max(0, Math.min(100, (remainingMs / durationMs) * 100));
  const timerRingStyle = { "--timer-progress": `${remainingPercent}%` } as CSSProperties;
  const feedback = t(alert.message ?? timer.completion_feedback, language, arabicVariant) || t(TIMER_LABELS.defaultFeedback, language, arabicVariant);
  useEffect(() => {
    onCompletedChangeRef.current = onCompletedChange;
  }, [onCompletedChange]);

  useEffect(() => {
    setRemainingMs(durationMs);
    setStatus("idle");
    targetTimeRef.current = null;
    completionAnnouncedRef.current = false;
    onCompletedChangeRef.current?.(false);
  }, [durationMs]);

  useEffect(() => {
    if (status !== "running") return;

    const interval = window.setInterval(() => {
      const targetTime = targetTimeRef.current ?? Date.now();
      const nextRemainingMs = Math.max(0, targetTime - Date.now());

      setRemainingMs(nextRemainingMs);

      if (nextRemainingMs <= 0) {
        window.clearInterval(interval);
        setStatus("completed");
      }
    }, 200);

    return () => {
      window.clearInterval(interval);
    };
  }, [status]);

  useEffect(() => {
    if (status !== "completed" || completionAnnouncedRef.current) return;

    completionAnnouncedRef.current = true;
    setRemainingMs(0);
    onCompletedChangeRef.current?.(true);
    if (alert.audio) playCompletionTone(alert.intensity);
  }, [alert.audio, alert.intensity, status]);

  function start() {
    const nextRemainingMs = status === "paused" ? remainingMs : durationMs;

    completionAnnouncedRef.current = false;
    targetTimeRef.current = Date.now() + nextRemainingMs;
    setRemainingMs(nextRemainingMs);
    setStatus("running");
    onCompletedChangeRef.current?.(false);
  }

  function pause() {
    if (status !== "running") return;

    const targetTime = targetTimeRef.current ?? Date.now();
    setRemainingMs(Math.max(0, targetTime - Date.now()));
    setStatus("paused");
  }

  function reset() {
    targetTimeRef.current = null;
    completionAnnouncedRef.current = false;
    setRemainingMs(durationMs);
    setStatus("idle");
    onCompletedChangeRef.current?.(false);
  }

  const statusLabel =
    status === "running"
      ? TIMER_LABELS.running
      : status === "paused"
        ? TIMER_LABELS.paused
        : status === "completed"
          ? TIMER_LABELS.completed
          : TIMER_LABELS.ready;

  return (
    <section className={`timer-panel timer-status-${status} timer-alert-${alert.intensity ?? "standard"}`} aria-label={t(TIMER_LABELS.label, language, arabicVariant)}>
      <div className="timer-ring" style={timerRingStyle} aria-hidden="true">
        <div className="timer-display" role="timer" aria-live="polite" aria-label={`${t(TIMER_LABELS.remaining, language, arabicVariant)} ${formatTimerTime(remainingSeconds)}`}>
          {formatTimerTime(remainingSeconds)}
        </div>
      </div>

      <div className="timer-meta" aria-live="polite">
        {t(statusLabel, language, arabicVariant)}
      </div>

      <div className="timer-controls">
        {status === "running" ? (
          <button className="button" type="button" aria-label={t(TIMER_LABELS.pause, language, arabicVariant)} onClick={pause}>
            {t(TIMER_LABELS.pause, language, arabicVariant)}
          </button>
        ) : (
          <button className="button primary" type="button" aria-label={t(status === "paused" ? TIMER_LABELS.resume : TIMER_LABELS.start, language, arabicVariant)} onClick={start}>
            {t(status === "paused" ? TIMER_LABELS.resume : TIMER_LABELS.start, language, arabicVariant)}
          </button>
        )}

        <button className="button danger" type="button" aria-label={t(TIMER_LABELS.reset, language, arabicVariant)} onClick={reset} disabled={status === "idle" && remainingMs === durationMs}>
          {t(TIMER_LABELS.reset, language, arabicVariant)}
        </button>
      </div>

      {status === "completed" && alert.visual !== false ? (
        <div className="feedback correct timer-complete" aria-live="assertive">
          {feedback}
        </div>
      ) : null}
    </section>
  );
}
