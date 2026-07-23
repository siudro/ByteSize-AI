"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ByteScreen } from "./ByteScreen";
import { ExperienceControls } from "./ExperienceProvider";
import { LanguageToggle, useLanguage } from "./LanguageProvider";
import { useProgress } from "./ProgressProvider";
import { t } from "@/lib/i18n";
import type { ArabicVariantCode, Byte, ByteScreen as ByteScreenData, LanguageCode, LocalizedText } from "@/lib/schema";

const MIN_SCREEN_TIME_SECONDS = 0.5;

type ByteRendererProps = {
  byte: Byte;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function screenRequiresAnswer(screen: ByteScreenData): boolean {
  const exercise = asRecord(screen.exercise);
  const microCheck = asRecord(screen.micro_check);
  const input = asRecord(screen.input);
  const directOptions = Array.isArray(screen.options) && screen.options.length > 0;
  const exerciseOptions = Array.isArray(exercise.options) && exercise.options.length > 0;
  const microCheckOptions = Array.isArray(microCheck.options) && microCheck.options.length > 0;

  const isWrittenQuestion =
    screen.type === "reflection" ||
    screen.response_type === "written" ||
    input.type === "text" ||
    input.type === "textarea";

  return directOptions || exerciseOptions || microCheckOptions || isWrittenQuestion;
}

function uiText(value: LocalizedText, language: LanguageCode, arabicVariant: ArabicVariantCode) {
  return t(value, language, arabicVariant);
}

export function ByteRenderer({ byte }: ByteRendererProps) {
  const router = useRouter();
  const { language, arabicVariant, direction } = useLanguage();
  const { loaded, isUnlocked, isCompleted, completeByte } = useProgress();

  const [index, setIndex] = useState(0);
  const [timePassed, setTimePassed] = useState(false);
  const [screenAnswered, setScreenAnswered] = useState(true);

  const screens = byte.screens ?? [];
  const currentScreen = screens[index];

  const progressPercent = screens.length ? ((index + 1) / screens.length) * 100 : 0;
  const blocked = loaded && !isUnlocked(byte.id) && !isCompleted(byte.id);
  const backToMapLabel = uiText({ ar: "العودة إلى الخارطة", ar_fusha: "العودة إلى الخريطة", en: "Back to map" }, language, arabicVariant);

  useEffect(() => {
    if (!currentScreen) {
      return;
    }

    const screenMinimumSeconds = Number(currentScreen.minimum_time_seconds ?? MIN_SCREEN_TIME_SECONDS);

    setTimePassed(false);
    setScreenAnswered(!screenRequiresAnswer(currentScreen));

    const timer = window.setTimeout(() => {
      setTimePassed(true);
    }, screenMinimumSeconds * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [index, currentScreen]);

  function markComplete() {
    completeByte(byte.id, byte.map?.unlocks ?? []);
  }

  function goNext() {
    if (!timePassed || !screenAnswered) {
      return;
    }

    if (index < screens.length - 1) {
      setIndex((current) => current + 1);
      return;
    }

    markComplete();
    router.push("/map");
  }

  if (!currentScreen) {
    return (
      <main className="byte-shell">
        <div className="screen-panel">
          <h1>{uiText({ ar: "لا توجد شاشات لهذا البايت", ar_fusha: "لا توجد شاشات لهذا البايت", en: "This Byte has no screens" }, language, arabicVariant)}</h1>

          <Link className="button primary" href="/map">
            {backToMapLabel}
          </Link>
        </div>
      </main>
    );
  }

  if (blocked) {
    return (
      <main className="byte-shell">
        <div className="screen-panel">
          <h1>{uiText({ ar: "هذا البايت مغلق الآن", ar_fusha: "هذا البايت مغلق حاليًا", en: "This Byte is currently locked" }, language, arabicVariant)}</h1>

          <p>
            {uiText(
              {
                ar: "أكمل البايت السابق لفتح هذه العقدة.",
                ar_fusha: "أكمل البايت السابق لفتح هذه العقدة.",
                en: "Complete the previous Byte to unlock this node."
              },
              language,
              arabicVariant
            )}
          </p>

          <Link className="button primary" href="/map">
            {backToMapLabel}
          </Link>
        </div>
      </main>
    );
  }

  const canContinue = timePassed && screenAnswered;

  return (
    <main className="byte-shell" dir={direction}>
      <header className="byte-header">
        <div className="topbar">
          <div>
            <Link className="eyebrow" href="/map">
              {backToMapLabel}
            </Link>

            <h1>{t(byte.title, language, arabicVariant)}</h1>
            <p>{t(byte.subtitle, language, arabicVariant)}</p>
          </div>

          <div className="topbar-controls">
            <ExperienceControls />
            <LanguageToggle />
          </div>
        </div>

        <div className="progress-track" aria-label={uiText({ ar: "تقدم البايت", ar_fusha: "تقدّم البايت", en: "Byte progress" }, language, arabicVariant)}>
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <ByteScreen
        key={`${index}-${currentScreen.id}`}
        byte={byte}
        language={language}
        arabicVariant={arabicVariant}
        screen={currentScreen}
        onReady={markComplete}
        onReview={() => setIndex(0)}
        onAnswerStateChange={setScreenAnswered}
      />

      <nav className="byte-nav" aria-label={uiText({ ar: "تنقل البايت", ar_fusha: "التنقل داخل البايت", en: "Byte navigation" }, language, arabicVariant)}>
        <button className="button" type="button" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0}>
          {uiText({ ar: "السابق", ar_fusha: "السابق", en: "Back" }, language, arabicVariant)}
        </button>

        {!timePassed && (
          <span className="continue-wait" aria-live="polite">
            ...
          </span>
        )}

        {timePassed && !screenAnswered && (
          <span className="continue-wait" aria-live="polite">
            {uiText({ ar: "أجب أولًا للمتابعة", ar_fusha: "أجب أولًا للمتابعة", en: "Answer before continuing" }, language, arabicVariant)}
          </span>
        )}

        {canContinue && (
          <button className="button primary" type="button" onClick={goNext}>
            {index === screens.length - 1
              ? backToMapLabel
              : t(currentScreen.continue_label, language, arabicVariant) || uiText({ ar: "التالي", ar_fusha: "التالي", en: "Next" }, language, arabicVariant)}
          </button>
        )}
      </nav>
    </main>
  );
}
