"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type { InteractionComponentProps, InteractionState } from "./types";

const ESTIMATE = 3720000000000000;
const HUMAN_OPS_PER_SECOND = 2;
const REFERENCE_GRAPHICS_CARD_OPS_PER_SECOND = 15000000000000;
const HUMAN_COUNTS = [1, 10, 1000, 1000000];
const YEAR_SECONDS = 365 * 24 * 60 * 60;
const DEMANDS = [1, 100, 10000, 1000000];
const DEMAND_INTENSITY = [8, 28, 58, 100];
const WATER_PER_IMAGE_ML = 29;
const WATER_IMAGE_BATCH = 1000000;
const WATER_TRUCK_LITERS = 10000;
const WATER_TRUCKS_PER_YEAR = Math.ceil((WATER_PER_IMAGE_ML * WATER_IMAGE_BATCH * 365) / 1000 / WATER_TRUCK_LITERS);
const WATER_TRUCKS_DISPLAY = Math.floor(WATER_TRUCKS_PER_YEAR / 1000) * 1000;
const TRILLION_PARAMETER_MODEL = 1000000000000;
const ESTIMATED_RESPONSE_TOKENS = 40;
const DEMAND_LABELS = [
  { ar: "شخص واحد", ar_fusha: "شخص واحد", en: "One person" },
  { ar: "100 شخص", ar_fusha: "100 شخص", en: "100 people" },
  { ar: "10 آلاف شخص", ar_fusha: "10 آلاف شخص", en: "10 thousand people" },
  { ar: "مليون شخص", ar_fusha: "مليون شخص", en: "A million people" }
];
const MARKET_EFFECTS = [
  {
    id: "supply-demand",
    icon: "📈",
    title: { ar: "الطلب على الذاكرة", ar_fusha: "الطلب على الذاكرة", en: "Demand for memory" },
    body: { ar: "كل عملية توليد تحتاج أرقامًا كثيرة قريبة من المعالج؛ إذا زاد الاستخدام، زاد الطلب على الذاكرة.", ar_fusha: "تحتاج كل عملية توليد إلى أرقام كثيرة قريبة من المعالج؛ ومع زيادة الاستخدام، يزداد الطلب على الذاكرة.", en: "Each generation needs many values close to the processor; as use grows, demand for memory grows too." }
  },
  {
    id: "water-energy",
    icon: "💧",
    title: { ar: "الماء والطاقة", ar_fusha: "الماء والطاقة", en: "Water and energy" },
    body: { ar: "مراكز البيانات تحتاج كهرباء وماء للتبريد، فيزيد الضغط على الموارد.", ar_fusha: "تحتاج مراكز البيانات إلى الكهرباء والماء للتبريد، فيزداد الضغط على الموارد.", en: "Data centers need electricity and water for cooling, adding pressure to resources." }
  },
  {
    id: "world-economy",
    icon: "🌍",
    title: { ar: "وش ممكن يتغير حولنا؟", ar_fusha: "ما الذي قد يتغير حولنا؟", en: "What Could Change for Us?" },
    body: { ar: "إذا زاد الطلب على الأجهزة والطاقة، ممكن ترتفع أسعار أشياء نشتريها كل يوم، مثل الأجهزة والأكل وبعض الخدمات.", ar_fusha: "إذا زاد الطلب على الأجهزة والطاقة، فقد ترتفع أسعار أشياء نشتريها كل يوم، مثل الأجهزة والطعام وبعض الخدمات.", en: "If demand for hardware and energy grows, everyday things we buy—like devices, food, and some services—could cost more." }
  }
];
const STAGES = [
  {
    label: { ar: "الطلب", ar_fusha: "الطلب", en: "Prompt" },
    explanation: { ar: "النص يحدد شكل الصورة اللي نبيها.", ar_fusha: "يحدد النص شكل الصورة المطلوبة.", en: "The prompt describes the image we want." },
    operation: { ar: "مدخل", ar_fusha: "مدخل", en: "Input" }
  },
  {
    label: { ar: "أرقام", ar_fusha: "أعداد", en: "Numbers" },
    explanation: { ar: "الحاسوب يحوّل الطلب إلى تمثيل رقمي يقدر يعالجه.", ar_fusha: "يحوّل الحاسوب الطلب إلى تمثيل رقمي يمكن معالجته.", en: "The computer turns the prompt into a numerical representation." },
    operation: { ar: "تمثيل رقمي", ar_fusha: "تمثيل رقمي", en: "Numerical representation" }
  },
  {
    label: { ar: "تشويش", ar_fusha: "تشويش", en: "Noise" },
    explanation: { ar: "تبدأ الصورة بشكل عشوائي وغير واضح.", ar_fusha: "تبدأ الصورة من شكل عشوائي وغير واضح.", en: "The image starts as random, unclear noise." },
    operation: { ar: "بداية غير واضحة", ar_fusha: "بداية غير واضحة", en: "Unclear starting point" }
  },
  {
    label: { ar: "حسابات", ar_fusha: "حسابات", en: "Calculations" },
    explanation: { ar: "نضرب أرقام المصفوفات ثم نجمع النواتج، مثل ما سوّينا في مثال المقهى.", ar_fusha: "نضرب أعداد المصفوفات ثم نجمع النواتج، كما فعلنا في مثال المقهى.", en: "We multiply matrix values and add the results, just as we did in the cafe example." },
    operation: { ar: "ضرب ثم جمع — ويتكرر", ar_fusha: "ضرب ثم جمع — ويتكرر", en: "Multiply, then add — repeated" }
  },
  {
    label: { ar: "بكسلات", ar_fusha: "بكسلات", en: "Pixels" },
    explanation: { ar: "القيم النهائية تحدد ألوان المربعات، فتظهر الصورة.", ar_fusha: "تحدد القيم النهائية ألوان المربعات، فتظهر الصورة.", en: "The final values determine pixel colors, revealing the image." },
    operation: { ar: "صورة أوضح", ar_fusha: "صورة أوضح", en: "Clearer image" }
  }
];

function format(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatDuration(seconds: number, language: InteractionComponentProps["language"], arabicVariant: InteractionComponentProps["arabicVariant"]) {
  if (seconds >= YEAR_SECONDS) {
    return t(
      {
        ar: `${format(seconds / YEAR_SECONDS)} سنة`,
        ar_fusha: `${format(seconds / YEAR_SECONDS)} سنة`,
        en: `${format(seconds / YEAR_SECONDS)} years`
      },
      language,
      arabicVariant
    );
  }

  const totalSeconds = Math.ceil(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return t(
    {
      ar: `${format(minutes)} دقيقة و${format(remainingSeconds)} ثانية`,
      ar_fusha: `${format(minutes)} دقيقة و${format(remainingSeconds)} ثانية`,
      en: `${format(minutes)}m ${format(remainingSeconds)}s`
    },
    language,
    arabicVariant
  );
}

export function AIComputeScaleLab(props: InteractionComponentProps) {
  if (props.stage === "operation-counter") return <OperationCounter {...props} />;
  if (props.stage === "parallel-workers") return <ParallelWorkers {...props} />;
  if (props.stage === "demand-scale") return <DemandScale {...props} />;
  if (props.stage === "water-shock") return <WaterShock {...props} />;
  if (props.stage === "market-effects") return <MarketEffects {...props} />;
  if (props.stage === "language-model") return <LanguageModel {...props} />;
  return <ImagePipeline {...props} />;
}

function ImagePipeline({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const rawStep = typeof savedState.step === "number" ? savedState.step : 0;
  const step = Math.min(Math.max(rawStep, 0), STAGES.length - 1);
  const currentStage = STAGES[step];
  function setStep(next: number) {
    const completed = next >= STAGES.length - 1;
    const state = { step: next, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }
  return (
    <div className="interaction-card matrix-lab">
      <div className="pipeline-row">{STAGES.map((stage, index) => <div className="pipeline-node" data-active={index <= step} key={stage.label.en}><strong>{index + 1}</strong><span>{t(stage.label, language, arabicVariant)}</span></div>)}</div>
      <label className="control-row"><span>{t({ ar: "مرحلة التوليد", ar_fusha: "مرحلة التوليد", en: "Generation stage" }, language, arabicVariant)}</span><input type="range" min={0} max={STAGES.length - 1} value={step} onChange={(e) => setStep(Number(e.target.value))} /></label>
      <div className="meaning-box pipeline-step-copy" aria-live="polite">
        <strong>{t(currentStage.label, language, arabicVariant)}</strong>
        <span>{t(currentStage.explanation, language, arabicVariant)}</span>
        <small>{t({ ar: "وش يصير في الحساب؟", ar_fusha: "ما الذي يحدث في الحساب؟", en: "What is happening in the computation?" }, language, arabicVariant)} {t(currentStage.operation, language, arabicVariant)}</small>
      </div>
    </div>
  );
}

function OperationCounter({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const revealed = savedState.revealed === true;
  const [value, setValue] = useState(0);
  const [running, setRunning] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  function reveal() {
    if (running) return;

    const duration = 2400;
    setValue(0);
    setRunning(true);

    function tick(now: number, startedAt: number) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ESTIMATE * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame((nextNow) => tick(nextNow, startedAt));
        return;
      }

      setValue(ESTIMATE);
      setRunning(false);
      const state = { revealed: true, completed: true };
      onStateChange(state);
      onComplete(state);
    }

    frameRef.current = requestAnimationFrame(() => {
      const startedAt = performance.now();
      frameRef.current = requestAnimationFrame((now) => tick(now, startedAt));
    });
  }
  return (
    <div className="interaction-card matrix-lab">
      <div className="operation-number" dir="ltr" aria-live="polite">{format(value)}</div>
      <p className="estimate-note">{t({ ar: "تقدير تقريبي لعدد العمليات الحسابية، وليس رقمًا ثابتًا لكل صورة.", ar_fusha: "تقدير تقريبي لعدد العمليات الحسابية، وليس رقمًا ثابتًا لكل صورة.", en: "An approximate calculation count, not a fixed number for every image." }, language, arabicVariant)}</p>
      <button className="button primary" type="button" onClick={reveal} disabled={running}>
        {t(
          running ? { ar: "العداد شغّال…", ar_fusha: "العداد يعمل…", en: "Counter running…" } : revealed ? { ar: "شغّل العداد من جديد", ar_fusha: "شغّل العداد من جديد", en: "Run the counter again" } : { ar: "شغّل العداد", ar_fusha: "شغّل العداد", en: "Run the counter" },
          language,
          arabicVariant
        )}
      </button>
    </div>
  );
}

function ParallelWorkers({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const savedHumans = typeof savedState.humans === "number" && HUMAN_COUNTS.includes(savedState.humans) ? savedState.humans : 1;
  const [humans, setHumans] = useState(savedHumans);
  const humanRate = humans * HUMAN_OPS_PER_SECOND;
  const humanSeconds = ESTIMATE / humanRate;
  const gpuSeconds = ESTIMATE / REFERENCE_GRAPHICS_CARD_OPS_PER_SECOND;

  function chooseHumans(nextHumans: number) {
    setHumans(nextHumans);
    const state = { humans: nextHumans, completed: true };
    onStateChange(state);
    onComplete(state);
  }

  return (
    <div className="interaction-card matrix-lab compute-comparison">
      <div className="meaning-box compute-target">
        <span>{t({ ar: "توليد صورة تونغ تونغ", ar_fusha: "توليد صورة تونغ تونغ", en: "Generating Tung Tung's image" }, language, arabicVariant)}</span>
        <strong dir={language === "en" ? "ltr" : "rtl"}>{t({ ar: "3.72 كوادريليون عملية حسابية", ar_fusha: "3.72 كوادريليون عملية حسابية", en: "3.72 quadrillion calculations" }, language, arabicVariant)}</strong>
      </div>

      <div className="compute-comparison-grid">
        <div className="compute-comparison-card">
          <div className="compute-card-heading-row">
            <span className="compute-card-icon"><HumanIcon /></span>
            <div className="compute-card-heading">
              <h3>{t({ ar: "فريق البشر", ar_fusha: "فريق البشر", en: "Human team" }, language, arabicVariant)}</h3>
              <small>{t({ ar: "عمليتان في الثانية للشخص", ar_fusha: "عمليتان في الثانية للإنسان", en: "Two calculations per person per second" }, language, arabicVariant)}</small>
            </div>
          </div>
          <div className="compute-card-control">
            <span>{t({ ar: "عدد الأشخاص", ar_fusha: "عدد الأشخاص", en: "Number of people" }, language, arabicVariant)}</span>
            <div className="compute-count-options" role="group" aria-label={t({ ar: "اختيار عدد الأشخاص", ar_fusha: "اختيار عدد الأشخاص", en: "Choose the number of people" }, language, arabicVariant)}>
              {HUMAN_COUNTS.map((count) => (
                <button className="compute-count-option" key={count} type="button" aria-pressed={humans === count} onClick={() => chooseHumans(count)}>
                  {format(count)}
                </button>
              ))}
            </div>
          </div>
          <div className="compute-stat">
            <span>{t({ ar: "سرعة الحساب", ar_fusha: "سرعة الحساب", en: "Calculation rate" }, language, arabicVariant)}</span>
            <strong>{format(humanRate)} {t({ ar: "عملية حسابية/ثانية", ar_fusha: "عملية حسابية/ثانية", en: "calculations/s" }, language, arabicVariant)}</strong>
          </div>
          <div className="compute-stat">
            <span>{t({ ar: "الوقت المطلوب", ar_fusha: "الوقت المطلوب", en: "Time needed" }, language, arabicVariant)}</span>
            <strong>{formatDuration(humanSeconds, language, arabicVariant)}</strong>
          </div>
        </div>

        <div className="compute-comparison-card compute-card-gpu">
          <div className="compute-card-heading-row">
            <span className="compute-card-icon"><ComputeIcon /></span>
            <div className="compute-card-heading">
              <h3>{t({ ar: "كرت الشاشة", ar_fusha: "كرت الشاشة", en: "Graphics card" }, language, arabicVariant)}</h3>
              <small>{t({ ar: "قطعة داخل الكمبيوتر تسوي عمليات ضرب مصفوفات كثيرة مع بعض", ar_fusha: "قطعة داخل الكمبيوتر تجري عمليات ضرب مصفوفات كثيرة معًا", en: "A computer part that performs many matrix multiplications at once" }, language, arabicVariant)}</small>
            </div>
          </div>
          <div className="compute-stat">
            <span>{t({ ar: "سرعة الحساب النظرية", ar_fusha: "سرعة الحساب النظرية", en: "Theoretical calculation rate" }, language, arabicVariant)}</span>
            <strong>{t({ ar: "15 تريليون عملية/ثانية", ar_fusha: "15 تريليون عملية/ثانية", en: "15 trillion calculations/s" }, language, arabicVariant)}</strong>
          </div>
          <div className="compute-stat">
            <span>{t({ ar: "الوقت التقديري", ar_fusha: "الوقت التقديري", en: "Estimated time" }, language, arabicVariant)}</span>
            <strong>{formatDuration(gpuSeconds, language, arabicVariant)}</strong>
          </div>
        </div>
      </div>

      <p className="estimate-note">{t({ ar: "تقدير نظري؛ الوقت الفعلي يختلف حسب البرنامج.", ar_fusha: "تقدير نظري؛ ويختلف الوقت الفعلي حسب البرنامج.", en: "Theoretical estimate; actual time varies by software." }, language, arabicVariant)}</p>
    </div>
  );
}

function HumanIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5.5" r="2.5" />
      <path d="M12 8v5.5M12 10 6 13M12 10l6 3M12 13.5 8 21M12 13.5l4 7" />
    </svg>
  );
}

function ComputeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <path d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3" />
    </svg>
  );
}

function DemandScale({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const index = typeof savedState.index === "number" ? savedState.index : 0;
  const requests = DEMANDS[index];
  function setIndex(next: number) {
    const completed = next === DEMANDS.length - 1;
    const state = { index: next, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }
  return (
    <div className="interaction-card matrix-lab">
      <div className="demand-scale-card">
        <div className="demand-scale-pattern" aria-hidden="true" />
        <div className="demand-scale-card-content">
          <h3>{t({ ar: "وش يصير لو مليون شخص ولّدوا صورة تونغ تونغ تونغ سحور بنفس الوقت؟", ar_fusha: "ماذا يحدث لو ولّد مليون شخص صورة تونغ تونغ تونغ سحور في الوقت نفسه؟", en: "What if a million people generated a Tung Tung Tung Sahur image at the same time?" }, language, arabicVariant)}</h3>
          <div className="demand-scenario-options" role="group" aria-label={t({ ar: "اختر عدد عمليات التوليد", ar_fusha: "اختر عدد عمليات التوليد", en: "Choose the number of generations" }, language, arabicVariant)}>
            {DEMANDS.map((request, scenarioIndex) => (
              <button className="demand-scenario" key={request} type="button" aria-pressed={index === scenarioIndex} onClick={() => setIndex(scenarioIndex)}>
                <strong>{t(DEMAND_LABELS[scenarioIndex], language, arabicVariant)}</strong>
                <span>{format(request)} {t({ ar: "عملية توليد", ar_fusha: "عملية توليد", en: "generations" }, language, arabicVariant)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="demand-scale-readout">
        <span>{t({ ar: "المشهد المختار", ar_fusha: "المشهد المختار", en: "Selected scenario" }, language, arabicVariant)}</span>
        <strong>{format(requests)} {t({ ar: "عملية توليد لصورة", ar_fusha: "عملية توليد لصورة", en: "image generations" }, language, arabicVariant)}</strong>
      </div>
      <div className="demand-impact-list">
        {[
          { ar: "أجهزة الحوسبة", ar_fusha: "أجهزة الحوسبة", en: "Compute hardware" },
          { ar: "الكهرباء", ar_fusha: "الكهرباء", en: "Electricity" },
          { ar: "الذاكرة", ar_fusha: "الذاكرة", en: "Memory" }
        ].map((label) => (
          <div className="demand-impact-row" key={label.en}>
            <span>{t(label, language, arabicVariant)}</span>
            <span className="demand-impact-track"><span style={{ width: `${DEMAND_INTENSITY[index]}%` }} /></span>
          </div>
        ))}
      </div>
      <div className="meaning-box">{t({ ar: "كل عملية توليد تشغّل نفس النوع من الحسابات. مليون عملية توليد تعني ضغطًا أكبر على الأجهزة والكهرباء والذاكرة.", ar_fusha: "كل عملية توليد تشغّل النوع نفسه من الحسابات. مليون عملية توليد تعني ضغطًا أكبر على الأجهزة والكهرباء والذاكرة.", en: "Every generation triggers the same kind of calculations. A million generations mean more pressure on machines, power, and memory." }, language, arabicVariant)}</div>
    </div>
  );
}

function WaterShock({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  useEffect(() => {
    if (savedState.completed === true) return;
    const state = { viewed: true, completed: true };
    onStateChange(state);
    onComplete(state);
  }, [onComplete, onStateChange, savedState.completed]);

  return (
    <div className="interaction-card matrix-lab water-shock">
      <div className="water-shock-amount" aria-live="polite">
        <span aria-hidden="true">💧</span>
        <strong>{t({ ar: `أكثر من ${format(WATER_TRUCKS_DISPLAY)} شاحنة ماء`, ar_fusha: `أكثر من ${format(WATER_TRUCKS_DISPLAY)} شاحنة ماء`, en: `More than ${format(WATER_TRUCKS_DISPLAY)} water trucks` }, language, arabicVariant)}</strong>
        <small>{t({ ar: "لو ولّدنا مليون صورة كل يوم لمدة سنة", ar_fusha: "إذا ولّدنا مليون صورة كل يوم لمدة سنة", en: "If we generated one million images every day for a year" }, language, arabicVariant)}</small>
      </div>
      <p className="estimate-note">{t({ ar: "تقدير تقريبي؛ يختلف حسب طريقة التبريد ومكان مركز البيانات.", ar_fusha: "تقدير تقريبي؛ ويختلف حسب طريقة التبريد وموقع مركز البيانات.", en: "A rough estimate; it varies with the cooling method and data-center location." }, language, arabicVariant)}</p>
    </div>
  );
}

function MarketEffects({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const selectedId = typeof savedState.selectedId === "string" ? savedState.selectedId : "";
  const visitedIds = Array.isArray(savedState.visitedIds) ? savedState.visitedIds.filter((value): value is string => typeof value === "string") : [];
  const selectedEffect = MARKET_EFFECTS.find((effect) => effect.id === selectedId);

  function chooseEffect(id: string) {
    const nextVisitedIds = Array.from(new Set([...visitedIds, id]));
    const state = { selectedId: id, visitedIds: nextVisitedIds, completed: nextVisitedIds.length === MARKET_EFFECTS.length };
    onStateChange(state);
    if (state.completed) onComplete(state);
  }

  function resetEffects() {
    onStateChange({ selectedId: "", visitedIds: [], completed: false });
  }

  return (
    <div className="interaction-card matrix-lab market-effects">
      <p className="market-effects-prompt">{t({ ar: "اضغط كل بطاقة وشوف السلسلة: ذاكرة، ماء وطاقة، ثم اقتصاد.", ar_fusha: "اضغط كل بطاقة وشاهد السلسلة: ذاكرة، وماء وطاقة، ثم اقتصاد.", en: "Open each card and follow the chain: memory, water and energy, then the economy." }, language, arabicVariant)}</p>
      <div className="market-chain" dir={language === "en" ? "ltr" : "rtl"} aria-hidden="true">
        {MARKET_EFFECTS.map((effect, index) => (
          <span className="market-chain-step" key={effect.id}>
            <span className="market-chain-node" data-active={visitedIds.includes(effect.id)} data-effect={effect.id}>{effect.icon}</span>
            {index < MARKET_EFFECTS.length - 1 ? <span className="market-chain-arrow">{language === "en" ? "→" : "←"}</span> : null}
          </span>
        ))}
      </div>
      <div className="market-effects-options" role="group" aria-label={t({ ar: "اختر عاملًا", ar_fusha: "اختر عاملًا", en: "Choose a factor" }, language, arabicVariant)}>
        {MARKET_EFFECTS.map((effect) => (
          <button className="market-effect-option" key={effect.id} type="button" aria-pressed={selectedId === effect.id} data-effect={effect.id} data-visited={visitedIds.includes(effect.id)} onClick={() => chooseEffect(effect.id)}>
            <span className="market-effect-icon" aria-hidden="true">{effect.icon}</span>
            <strong>{t(effect.title, language, arabicVariant)}</strong>
          </button>
        ))}
      </div>
      {selectedEffect ? <div className="meaning-box market-effect-result" aria-live="polite"><strong>{t(selectedEffect.title, language, arabicVariant)}</strong><span>{t(selectedEffect.body, language, arabicVariant)}</span></div> : null}
      {visitedIds.length === MARKET_EFFECTS.length ? <button className="icon-button market-effect-repeat" type="button" aria-label={t({ ar: "إعادة التجربة", ar_fusha: "إعادة التجربة", en: "Repeat the interaction" }, language, arabicVariant)} title={t({ ar: "إعادة التجربة", ar_fusha: "إعادة التجربة", en: "Repeat the interaction" }, language, arabicVariant)} onClick={resetEffects}><IconRepeat /></button> : null}
    </div>
  );
}

function LanguageModel({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const text = typeof savedState.text === "string" ? savedState.text : "";
  const inputTokens = text.trim() ? Math.max(1, Math.ceil(text.trim().length / 4)) : 0;
  const totalTokens = inputTokens + (text.trim() ? ESTIMATED_RESPONSE_TOKENS : 0);
  const operations = 2 * TRILLION_PARAMETER_MODEL * totalTokens;

  function commit(next: InteractionState) {
    const state = { text: typeof next.text === "string" ? next.text : text, ...next, completed: true };
    onStateChange(state);
    onComplete(state);
  }

  return (
    <div className="interaction-card matrix-lab language-model-lab">
      <label className="field-label">
        <span>{t({ ar: "اكتب شيئًا تقوله عادةً للذكاء الاصطناعي", ar_fusha: "اكتب شيئًا تقوله عادةً للذكاء الاصطناعي", en: "Type something you usually say to AI" }, language, arabicVariant)}</span>
        <input className="input-field" value={text} onChange={(e) => commit({ text: e.target.value })} placeholder={t({ ar: "مثال: لخّص لي هذا النص", ar_fusha: "مثال: لخّص لي هذا النص", en: "Example: Summarize this text" }, language, arabicVariant)} />
      </label>
      <div className="operation-number language-model-operation" aria-live="polite">
        {operations ? (
          <>
            <span className="operation-count" dir="ltr">{format(operations)}</span>
            <span className="operation-label" dir={language === "en" ? "ltr" : "rtl"}>{t({ ar: "عملية حسابية", ar_fusha: "عملية حسابية", en: "calculations" }, language, arabicVariant)}</span>
          </>
        ) : "—"}
      </div>
      <p className="estimate-note">{t({ ar: "تقدير تقريبي لعمليات ضرب المصفوفات: يجمع كلامك مع رد متوقع، ويفترض نموذجًا ضخمًا فيه تريليون معامل.", ar_fusha: "تقدير تقريبي لعمليات ضرب المصفوفات: يجمع كلامك مع رد متوقع، ويفترض نموذجًا ضخمًا فيه تريليون معامل.", en: "A rough matrix-multiplication estimate combining your prompt with an expected reply, using a huge model with one trillion parameters." }, language, arabicVariant)}</p>
    </div>
  );
}

function IconRepeat() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
      <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  );
}
