"use client";

import { t } from "@/lib/i18n";
import type { InteractionComponentProps, InteractionState } from "./types";

const ESTIMATE = 3720000000000000;
const DEMANDS = [1, 100, 10000, 1000000];
const STAGES = ["Prompt", "Numbers", "Noise", "Layers", "Pixels"];

function format(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function AIComputeScaleLab(props: InteractionComponentProps) {
  if (props.stage === "operation-counter") return <OperationCounter {...props} />;
  if (props.stage === "parallel-workers") return <ParallelWorkers {...props} />;
  if (props.stage === "demand-scale") return <DemandScale {...props} />;
  if (props.stage === "language-model") return <LanguageModel {...props} />;
  return <ImagePipeline {...props} />;
}

function ImagePipeline({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const step = typeof savedState.step === "number" ? savedState.step : 0;
  function setStep(next: number) {
    const completed = next >= STAGES.length - 1;
    const state = { step: next, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }
  return (
    <div className="interaction-card matrix-lab">
      <div className="pipeline-row">{STAGES.map((stage, index) => <div className="pipeline-node" data-active={index <= step} key={stage}><strong>{index + 1}</strong><span>{stage}</span></div>)}</div>
      <label className="control-row"><span>{t({ ar: "مرحلة التوليد", ar_fusha: "مرحلة التوليد", en: "Generation stage" }, language, arabicVariant)}</span><input type="range" min={0} max={STAGES.length - 1} value={step} onChange={(e) => setStep(Number(e.target.value))} /></label>
      <div className="meaning-box">{t({ ar: "مولدات الصور الحديثة تحول تمثيلات عددية مرارا. ضرب المصفوفات من أهم العمليات المتكررة داخل هذه النماذج.", ar_fusha: "تقوم مولدات الصور الحديثة بتحويل تمثيلات عددية مرارا. ضرب المصفوفات من أهم العمليات المتكررة داخل هذه النماذج.", en: "Modern image generators repeatedly transform numerical representations. Matrix multiplication is one of the most important repeated operations inside these models." }, language, arabicVariant)}</div>
    </div>
  );
}

function OperationCounter({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const revealed = savedState.revealed === true;
  function reveal() {
    const state = { revealed: true, completed: true };
    onStateChange(state);
    onComplete(state);
  }
  return (
    <div className="interaction-card matrix-lab">
      <div className="operation-number" dir="ltr">{revealed ? format(ESTIMATE) : "3,720,000,000,000,000"}</div>
      <p className="estimate-note">{t({ ar: "تقدير تعليمي تقريبي، وليس عددا ثابتا دقيقا.", ar_fusha: "تقدير تعليمي تقريبي، وليس عددا ثابتا دقيقا.", en: "Approximate educational estimate, not an exact fixed count." }, language, arabicVariant)}</p>
      <button className="button primary" type="button" onClick={reveal}>{t({ ar: "ثبّت التقدير", ar_fusha: "ثبّت التقدير", en: "Confirm estimate" }, language, arabicVariant)}</button>
    </div>
  );
}

function ParallelWorkers({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const speed = typeof savedState.speed === "number" ? savedState.speed : 2;
  const years = ESTIMATE / speed / 60 / 60 / 24 / 365;
  function finish(nextSpeed = speed) {
    const state = { speed: nextSpeed, completed: true };
    onStateChange(state);
    onComplete(state);
  }
  return (
    <div className="interaction-card matrix-lab">
      <label className="control-row"><span>{t({ ar: "عمليات الإنسان في الثانية", ar_fusha: "عمليات الإنسان في الثانية", en: "Human ops per second" }, language, arabicVariant)}</span><select value={speed} onChange={(e) => finish(Number(e.target.value))}>{[1, 2, 10].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
      <div className="race-track"><span style={{ width: "4%" }}>{t({ ar: "إنسان", ar_fusha: "إنسان", en: "Human" }, language, arabicVariant)}</span><strong>{t({ ar: "آلة متوازية", ar_fusha: "آلة متوازية", en: "Parallel machine" }, language, arabicVariant)}</strong></div>
      <div className="meaning-box">{t({ ar: `بهذا الافتراض المرح: حوالي ${format(years)} سنة. اسم المعالجات المتخصصة لهذا العمل غالبا GPUs.`, ar_fusha: `بهذا الافتراض المرح: حوالي ${format(years)} سنة. اسم المعالجات المتخصصة لهذا العمل غالبا GPUs.`, en: `With this playful assumption: about ${format(years)} years. Specialized processors for this work are often called GPUs.` }, language, arabicVariant)}</div>
    </div>
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
      <label className="control-row"><span>{t({ ar: "عدد الطلبات", ar_fusha: "عدد الطلبات", en: "Requests" }, language, arabicVariant)}</span><input type="range" min={0} max={DEMANDS.length - 1} value={index} onChange={(e) => setIndex(Number(e.target.value))} /></label>
      <div className="scale-bars"><span style={{ width: `${20 + index * 25}%` }}>{format(requests)}</span><span style={{ width: `${15 + index * 24}%` }}>{t({ ar: "آلات أكثر", ar_fusha: "آلات أكثر", en: "More machines" }, language, arabicVariant)}</span><span style={{ width: `${15 + index * 24}%` }}>{t({ ar: "ذاكرة أسرع", ar_fusha: "ذاكرة أسرع", en: "Faster memory" }, language, arabicVariant)}</span></div>
      <div className="meaning-box">{t({ ar: "صورة تونغ واحدة ليست المشكلة. الطلب الكبير على بنية الذكاء الاصطناعي جزء من قصة العرض والطلب على الذاكرة.", ar_fusha: "صورة تونغ واحدة ليست المشكلة. الطلب الكبير على بنية الذكاء الاصطناعي جزء من قصة العرض والطلب على الذاكرة.", en: "One Tung image is not the problem. Large AI infrastructure demand is part of the memory supply-and-demand story." }, language, arabicVariant)}</div>
    </div>
  );
}

function LanguageModel({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const text = typeof savedState.text === "string" ? savedState.text : "";
  const params = typeof savedState.params === "number" ? savedState.params : 8000000000;
  const output = typeof savedState.output === "number" ? savedState.output : 20;
  const tokens = Math.max(1, text.trim().split(/\s+/).filter(Boolean).length + output);
  const operations = 2 * params * tokens;

  function commit(next: InteractionState) {
    const state = { text, params, output, ...next, completed: true };
    onStateChange(state);
    onComplete(state);
  }

  return (
    <div className="interaction-card matrix-lab">
      <label className="field-label"><span>{t({ ar: "اكتب جملة قصيرة", ar_fusha: "اكتب جملة قصيرة", en: "Type a short sentence" }, language, arabicVariant)}</span><input className="input-field" value={text} onChange={(e) => commit({ text: e.target.value })} /></label>
      <label className="control-row"><span>{t({ ar: "حجم النموذج", ar_fusha: "حجم النموذج", en: "Model size" }, language, arabicVariant)}</span><select value={params} onChange={(e) => commit({ params: Number(e.target.value) })}><option value={8000000000}>8B</option><option value={70000000000}>70B</option></select></label>
      <label className="control-row"><span>{t({ ar: "توكنات الخرج", ar_fusha: "رموز الخرج", en: "Output tokens" }, language, arabicVariant)}</span><input min={5} max={80} value={output} type="range" onChange={(e) => commit({ output: Number(e.target.value) })} /></label>
      <div className="operation-number" dir="ltr">{format(operations)}</div>
      <p className="estimate-note">{t({ ar: "تقدير تعليمي تقريبي لعمليات يغلب عليها ضرب المصفوفات، وليس معرفة ببنية نموذج خاص.", ar_fusha: "تقدير تعليمي تقريبي لعمليات يغلب عليها ضرب المصفوفات، وليس معرفة ببنية نموذج خاص.", en: "A rough educational estimate dominated by matrix multiplication, not a claim about a private model architecture." }, language, arabicVariant)}</p>
    </div>
  );
}