"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { withBasePath } from "@/lib/media";
import type { InteractionComponentProps } from "./types";

export type SpiceCell = {
  row: number;
  col: number;
  color: string;
  label: { ar: string; ar_fusha: string; en: string };
};

/** 3×3 shelf, red first so it lands at row 1, column 1 (top-left). */
export const SHELF: SpiceCell[] = [
  { row: 1, col: 1, color: "#c0392b", label: { ar: "بابريكا", ar_fusha: "بابريكا", en: "Paprika" } },
  { row: 1, col: 2, color: "#d4ac0d", label: { ar: "ملح", ar_fusha: "ملح", en: "Salt" } },
  { row: 1, col: 3, color: "#e67e22", label: { ar: "كمون", ar_fusha: "كمون", en: "Cumin" } },
  { row: 2, col: 1, color: "#27ae60", label: { ar: "ثوم بودرة", ar_fusha: "مسحوق الثوم", en: "Garlic powder" } },
  { row: 2, col: 2, color: "#16a085", label: { ar: "بصل بودرة", ar_fusha: "مسحوق البصل", en: "Onion powder" } },
  { row: 2, col: 3, color: "#2980b9", label: { ar: "فلفل أسود", ar_fusha: "فلفل أسود مطحون", en: "Black pepper" } },
  { row: 3, col: 1, color: "#8e44ad", label: { ar: "فلفل مجروش", ar_fusha: "فلفل أحمر مجروش", en: "Chili flakes" } },
  { row: 3, col: 2, color: "#d81b60", label: { ar: "كركم", ar_fusha: "كركم", en: "Turmeric" } },
  { row: 3, col: 3, color: "#6d4c41", label: { ar: "بهارات مشكلة", ar_fusha: "بهارات مشكلة", en: "Mixed spices" } }
];

const RED_INDEX = 0;

const MOM_ANGRY = {
  ar: "💢 وإن قمت ولقيته؟؟؟",
  ar_fusha: "💢 وإن قمت ولقيته؟؟؟",
  en: "💢 What if I got up and found it myself?!"
};

const MOM_HAPPY = {
  ar: "أخيرًا! هذا اللي أقصد بالضبط.",
  ar_fusha: "أخيرًا! هذا ما أعنيه بالضبط.",
  en: "Finally! That's exactly the one I meant."
};

const UNAVAILABLE = {
  ar: "هذا النشاط غير جاهز بعد.",
  ar_fusha: "هذا النشاط غير جاهز بعد.",
  en: "This activity is not ready yet."
};

export function SpiceShelf(props: InteractionComponentProps) {
  const { language, arabicVariant, config, savedState, onStateChange, onComplete } = props;
  const stage = typeof config.stage === "string" ? config.stage : undefined;
  const backgroundImage = typeof config.background_image === "string" ? withBasePath(config.background_image) : "";

  const restoredTried = Array.isArray(savedState?.wrongAttempts)
    ? (savedState.wrongAttempts as number[]).filter((n) => typeof n === "number")
    : [];

  const [found, setFound] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState<number[]>(restoredTried);

  if (stage !== "find-red") {
    return (
      <div className="interaction-card" role="status">
        <strong>{t(UNAVAILABLE, language, arabicVariant)}</strong>
      </div>
    );
  }

  function handleTap(index: number) {
    if (index === RED_INDEX) {
      setFound(true);
      onStateChange({ found: true, wrongAttempts, completed: true });
      onComplete({ found: true, wrongAttempts, completed: true });
      return;
    }
    const next = [...wrongAttempts, index];
    setFound(false);
    setWrongAttempts(next);
    onStateChange({ found: false, wrongAttempts: next, completed: false });
  }

  return (
    <div className="interaction-card spice-shelf-stage">
      {backgroundImage ? <img className="spice-shelf-background" src={backgroundImage} alt="" aria-hidden="true" /> : null}
      <div className="spice-shelf-grid" dir="ltr">
        {SHELF.map((cell, index) => {
          const isRed = index === RED_INDEX;
          const wrong = wrongAttempts.includes(index);
          return (
            <button
              type="button"
              key={`${cell.row}-${cell.col}`}
              className="spice-cell"
              style={{ "--spice-color": cell.color } as React.CSSProperties}
              data-red={isRed && found ? "true" : undefined}
              data-wrong={wrong ? "true" : undefined}
              data-found={found && isRed ? "true" : undefined}
              aria-label={t(cell.label, language, arabicVariant)}
              aria-pressed={found && isRed}
              onClick={() => handleTap(index)}
            >
              <span className="spice-lid" />
              <span className="spice-body">{t(cell.label, language, arabicVariant)}</span>
            </button>
          );
        })}
      </div>

      <div className="spice-feedback" role="status" aria-live="polite">
        {found ? (
          <strong className="spice-correct">{t(MOM_HAPPY, language, arabicVariant)}</strong>
        ) : wrongAttempts.length > 0 ? (
          <strong className="spice-wrong">{t(MOM_ANGRY, language, arabicVariant)}</strong>
        ) : (
          <span>{t({ ar: "اضغط البهار الأحمر: الصف الأول، العمود الأول.", ar_fusha: "اضغط البهار الأحمر: الصف الأول، العمود الأول.", en: "Tap the red spice: row 1, column 1." }, language, arabicVariant)}</span>
        )}
      </div>
    </div>
  );
}
