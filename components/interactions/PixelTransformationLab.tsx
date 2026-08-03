"use client";

import { t } from "@/lib/i18n";
import type { InteractionComponentProps, InteractionState } from "./types";

const ROW = [0, 1, 1, 0];
const TARGET = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 2, 2, 2, 1, 1, 0],
  [0, 1, 2, 2, 2, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 3, 1, 1, 3, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 0, 0, 1, 0, 0]
];
const COLORS = ["#f6efe3", "#2f75b8", "#d9eef8", "#1d4d7a"];

function mirror(grid: number[][]) {
  return grid.map((row) => [...row].reverse());
}

function MiniPixel({ grid }: { grid: number[][] }) {
  return <div className="pixel-character-grid small">{grid.flatMap((row, r) => row.map((value, c) => <span className="pixel-art-cell static" key={`${r}-${c}`} style={{ background: COLORS[value] }} />))}</div>;
}

export function PixelTransformationLab(props: InteractionComponentProps) {
  if (props.stage === "one-cell") return <OneCell {...props} />;
  if (props.stage === "run-all") return <RunAll {...props} />;
  if (props.stage === "project-transform") return <ProjectTransform {...props} />;
  return <Predict {...props} />;
}

function Predict({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const choice = typeof savedState.choice === "string" ? savedState.choice : "";
  function choose(next: string) {
    const completed = next === "mirror";
    const state = { choice: next, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }
  return (
    <div className="interaction-card matrix-lab">
      <div className="lab-columns"><MiniPixel grid={TARGET} /><div className="matrix-grid compact" dir="ltr">{[0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0].map((v, i) => <span className="seat-cell static" key={i}>{v}</span>)}</div></div>
      <div className="button-row">
        {[
          { id: "mirror", label: { ar: "تنعكس", ar_fusha: "تنعكس", en: "Mirror" } },
          { id: "grow", label: { ar: "تكبر", ar_fusha: "تكبر", en: "Grow" } },
          { id: "disappear", label: { ar: "تختفي", ar_fusha: "تختفي", en: "Disappear" } }
        ].map((item) => <button className="button" aria-pressed={choice === item.id} key={item.id} type="button" onClick={() => choose(item.id)}>{t(item.label, language, arabicVariant)}</button>)}
      </div>
      {choice ? <div className={choice === "mirror" ? "feedback correct" : "feedback incorrect"}>{choice === "mirror" ? t({ ar: "صحيح. هذه مصفوفة عكس أفقي.", ar_fusha: "صحيح. هذه مصفوفة عكس أفقي.", en: "Correct. This is a horizontal reversal matrix." }, language, arabicVariant) : t({ ar: "قريب. لاحظ مكان الآحاد: تنقل القيم للجهة المقابلة.", ar_fusha: "قريب. لاحظ مواضع الآحاد: تنقل القيم للجهة المقابلة.", en: "Close. Notice the ones: they move values to the opposite side." }, language, arabicVariant)}</div> : null}
    </div>
  );
}

function OneCell({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const answer = typeof savedState.answer === "number" ? savedState.answer : -1;
  function choose(value: number) {
    const completed = value === 0;
    const state = { answer: value, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }
  return (
    <div className="interaction-card matrix-lab">
      <div className="calculation-strip" dir="ltr"><span>[{ROW.join(", ")}]</span><span> x </span><span>[1, 0, 0, 0]</span><strong>= ?</strong></div>
      <div className="button-row">{[0, 1, 2].map((value) => <button className="button" aria-pressed={answer === value} key={value} type="button" onClick={() => choose(value)}>{value}</button>)}</div>
      {answer >= 0 ? <div className={answer === 0 ? "feedback correct" : "feedback incorrect"}>{answer === 0 ? t({ ar: "صحيح: 0x1 + 1x0 + 1x0 + 0x0 = 0.", ar_fusha: "صحيح: 0x1 + 1x0 + 1x0 + 0x0 = 0.", en: "Correct: 0x1 + 1x0 + 1x0 + 0x0 = 0." }, language, arabicVariant) : t({ ar: "جرّب جمع حاصل ضرب كل زوج.", ar_fusha: "جرّب جمع حاصل ضرب كل زوج.", en: "Try adding the product of each pair." }, language, arabicVariant)}</div> : null}
    </div>
  );
}

function RunAll({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const ran = savedState.ran === true;
  function run() {
    const state = { ran: true, completed: true };
    onStateChange(state);
    onComplete(state);
  }
  return (
    <div className="interaction-card matrix-lab">
      <div className="lab-columns"><div><strong>{t({ ar: "الأصل", ar_fusha: "الأصل", en: "Original" }, language, arabicVariant)}</strong><MiniPixel grid={TARGET} /></div><div><strong>{t({ ar: "بعد التحويل", ar_fusha: "بعد التحويل", en: "Transformed" }, language, arabicVariant)}</strong>{ran ? <MiniPixel grid={mirror(TARGET)} /> : <div className="empty-result">?</div>}</div></div>
      <button className="button primary" type="button" onClick={run}>{t({ ar: "شغّل التحويل", ar_fusha: "شغّل التحويل", en: "Run transformation" }, language, arabicVariant)}</button>
      <div className="meaning-box">{ran ? t({ ar: "المصفوفة لم تخترع شخصية جديدة؛ رتبت التمثيل العددي بطريقة مختلفة.", ar_fusha: "المصفوفة لم تخترع شخصية جديدة؛ أعادت ترتيب التمثيل العددي بطريقة مختلفة.", en: "The multiplication did not invent a new character; it rearranged the numerical representation." }, language, arabicVariant) : t({ ar: "اضغط لتطبيق مصفوفة العكس على كل صف.", ar_fusha: "اضغط لتطبيق مصفوفة العكس على كل صف.", en: "Press to apply the reversal matrix to every row." }, language, arabicVariant)}</div>
    </div>
  );
}

function ProjectTransform({ language, arabicVariant, onComplete, onStateChange }: InteractionComponentProps) {
  function finish() {
    const state = { completed: true, projectTransform: true };
    onStateChange(state);
    onComplete(state);
  }
  return (
    <div className="interaction-card matrix-lab">
      <div className="lab-columns"><MiniPixel grid={TARGET} /><MiniPixel grid={mirror(TARGET)} /></div>
      <div className="meaning-box">{t({ ar: "استخدم البطاقة الورقية أو النسخة الرقمية لحساب خلية واحدة ثم أكمل النسخة المعكوسة.", ar_fusha: "استخدم البطاقة الورقية أو النسخة الرقمية لحساب خلية واحدة ثم أكمل النسخة المعكوسة.", en: "Use the paper card or digital fallback to calculate one cell and complete the mirrored version." }, language, arabicVariant)}</div>
      <button className="button primary" type="button" onClick={finish}>{t({ ar: "أنهيت بطاقة التحويل", ar_fusha: "أنهيت بطاقة التحويل", en: "Transformation card done" }, language, arabicVariant)}</button>
    </div>
  );
}