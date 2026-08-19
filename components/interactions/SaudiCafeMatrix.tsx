"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { t } from "@/lib/i18n";
import type { InteractionComponentProps, InteractionState } from "./types";

const PEOPLE = ["Sara", "Fahad", "Noura"];
const DRINKS = ["Saudi coffee", "Karak"];
const SUPPLIES = ["Cups", "Water", "Milk"];
const RECIPE = [[1, 1, 0], [1, 1, 1]];
const ORDER_PEOPLE = PEOPLE.slice(0, 2);
const ORDER_DEFAULTS = [[0, 0], [0, 0]];
const DEMO_ORDERS = [[2, 1], [1, 0]];
const PRACTICE_TASKS = SUPPLIES.map((_, col) => ({ row: 1, col }));
const PRACTICE_STATE_VERSION = 3;

function label(name: string, language: string) {
  const ar: Record<string, string> = { Sara: "سارة", Fahad: "فهد", Noura: "نورة", "Saudi coffee": "قهوة سعودية", Karak: "كرك", Cups: "أكواب", Water: "ماء", Milk: "حليب" };
  return language === "en" ? name : ar[name] ?? name;
}

export function SaudiCafeMatrix(props: InteractionComponentProps) {
  if (props.stage === "recipes") return <RecipeStage {...props} />;
  if (props.stage === "shared-link") return <SharedLinkStage {...props} />;
  if (props.stage === "row-column-demo") return <RowColumnDemo {...props} />;
  if (props.stage === "row-column-all") return <AllRowsColumnsDemo {...props} />;
  if (props.stage === "row-column-practice") return <RowColumnPractice {...props} />;
  if (props.stage === "multiplication-revision") return <MultiplicationRevision {...props} />;
  if (props.stage === "dimension-intro") return <DimensionIntro {...props} />;
  if (props.stage === "dimension-check") return <DimensionCheck {...props} />;
  if (props.stage === "multiplication-rule") return <MultiplicationRule {...props} />;
  if (props.stage === "multiplication-check-one" || props.stage === "multiplication-check-two") return <MultiplicationCheck {...props} />;
  return <OrdersStage {...props} />;
}

function MatrixTable({ rows, cols, values, language, highlightRow, highlightCol, activeCell, sharedCols, sharedRows, labelColWidth, resultTable, hideLabels }: { rows: string[]; cols: string[]; values: Array<Array<number | string>>; language: string; highlightRow?: number; highlightCol?: number; activeCell?: string; sharedCols?: number[]; sharedRows?: number[]; labelColWidth?: string; resultTable?: boolean; hideLabels?: boolean }) {
  return (
    <div className={`matrix-grid labelled-grid${hideLabels ? " matrix-no-labels" : ""}`} data-matrix-cols={cols.length} data-wide-label={labelColWidth ? "true" : undefined} style={{ gridTemplateColumns: labelColWidth ? `${labelColWidth} repeat(${cols.length}, minmax(48px, 1fr))` : `repeat(${cols.length + 1}, minmax(58px, 1fr))` }}>
      <span />
      {cols.map((col, index) => <strong data-highlight={highlightCol === index} data-shared={sharedCols?.includes(index) ? "true" : undefined} key={col}>{label(col, language)}</strong>)}
      {rows.flatMap((row, rowIndex) => [
        <strong data-highlight={highlightRow === rowIndex} data-shared={sharedRows?.includes(rowIndex) ? "true" : undefined} data-person-row={rowIndex} key={row}>{label(row, language)}</strong>,
        ...cols.map((col, colIndex) => {
          const cellId = `${rowIndex}-${colIndex}`;
          return <span className="seat-cell static" data-active={activeCell === cellId} data-highlight={highlightRow === rowIndex || highlightCol === colIndex} data-order-cell={cellId} data-result-cell={resultTable ? cellId : undefined} data-person-row={rowIndex} key={`${row}-${col}`}>{values[rowIndex][colIndex]}</span>;
        })
      ])}
    </div>
  );
}
function OrdersStage({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [transfer, setTransfer] = useState<{ id: string; value: number; row: number; startX: number; startY: number; endX: number; endY: number } | null>(null);
  const isCurrentState = savedState.ordersMode === "free-input-v2";
  const savedOrders = isCurrentState && Array.isArray(savedState.orders) ? (savedState.orders as number[][]) : [];
  const orders = ORDER_DEFAULTS.map((row, r) => row.map((value, c) => Number.isInteger(savedOrders[r]?.[c]) ? savedOrders[r][c] : value));
  const touched = new Set(isCurrentState && Array.isArray(savedState.touched) ? (savedState.touched as string[]) : []);
  const complete = touched.size >= ORDER_PEOPLE.length * DRINKS.length;

  function setOrder(r: number, c: number, rawValue: number, source: HTMLInputElement) {
    const value = Number.isFinite(rawValue) ? Math.max(0, Math.floor(rawValue)) : 0;
    const root = rootRef.current;
    const destination = root?.querySelector(`[data-order-cell="${r}-${c}"]`);
    if (root && destination instanceof HTMLElement) {
      const rootBox = root.getBoundingClientRect();
      const sourceBox = source.getBoundingClientRect();
      const destinationBox = destination.getBoundingClientRect();
      setTransfer({
        id: `${r}-${c}-${Date.now()}`,
        value,
        row: r,
        startX: sourceBox.left + sourceBox.width / 2 - rootBox.left,
        startY: sourceBox.top + sourceBox.height / 2 - rootBox.top,
        endX: destinationBox.left + destinationBox.width / 2 - rootBox.left,
        endY: destinationBox.top + destinationBox.height / 2 - rootBox.top
      });
    }

    const next = orders.map((row) => [...row]);
    next[r][c] = value;
    touched.add(`${r}-${c}`);
    const completed = touched.size >= ORDER_PEOPLE.length * DRINKS.length;
    const state = { ...savedState, ordersMode: "free-input-v2", orders: next, touched: Array.from(touched), activeCell: `${r}-${c}`, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }

  return (
    <div className="interaction-card matrix-lab cafe-orders-stage" ref={rootRef}>
      <div className="cafe-order-grid compact">
        {ORDER_PEOPLE.map((person, r) => (
          <section className="info-block cafe-person-card" data-person-row={r} key={person}>
            <strong>{label(person, language)}</strong>
            {DRINKS.map((drink, c) => (
              <label className="order-choice-row" key={drink}>
                <span>{label(drink, language)}</span>
                <input className="order-count-input" min={0} inputMode="numeric" type="number" value={orders[r][c]} onChange={(event) => setOrder(r, c, event.currentTarget.valueAsNumber, event.currentTarget)} />
              </label>
            ))}
          </section>
        ))}
      </div>
      <MatrixTable rows={ORDER_PEOPLE} cols={DRINKS} values={orders} language={language} activeCell={typeof savedState.activeCell === "string" ? savedState.activeCell : undefined} />
      {transfer ? (
        <span
          className="order-fly-number"
          data-person-row={transfer.row}
          key={transfer.id}
          onAnimationEnd={() => setTransfer(null)}
          style={{
            "--start-x": `${transfer.startX}px`,
            "--start-y": `${transfer.startY}px`,
            "--end-x": `${transfer.endX}px`,
            "--end-y": `${transfer.endY}px`
          } as CSSProperties}
        >
          {transfer.value}
        </span>
      ) : null}
      <div className="meaning-box" aria-live="polite">
        {complete
          ? t({ ar: "هذه مصفوفة طلبات: الصف للشخص، والعمود للمشروب.", ar_fusha: "هذه مصفوفة طلبات: الصف للشخص، والعمود للمشروب.", en: "This is an orders matrix: each row is a person, and each column is a drink." }, language, arabicVariant)
          : t({ ar: "ابدأ من الصفر، ثم اكتب عدد كل مشروب. الرقم يتحرك إلى مكانه في المصفوفة.", ar_fusha: "ابدأ من الصفر، ثم اكتب عدد كل مشروب. يتحرك الرقم إلى مكانه في المصفوفة.", en: "Start from zero, then type each drink amount. The number moves into its matrix cell." }, language, arabicVariant)}
      </div>
    </div>
  );
}
function RecipeStage({ language, arabicVariant }: InteractionComponentProps) {
  return (
    <div className="interaction-card matrix-lab cafe-recipe-stage">
      <MatrixTable rows={DRINKS} cols={SUPPLIES} values={RECIPE} language={language} />
      <div className="recipe-supply-icons" aria-label={language === "en" ? "Recipe supplies" : "مستلزمات التحضير"}>
        {[
          ["Cups", "🥤"],
          ["Water", "💧"],
          ["Milk", "🥛"]
        ].map(([supply, icon]) => (
          <div className="recipe-supply-icon" key={supply}>
            <span aria-hidden="true">{icon}</span>
            <small>{label(supply, language)}</small>
          </div>
        ))}
      </div>
      <div className="meaning-box">
        {t({ ar: "كل صف هو مشروب. كل عمود هو شيء نحتاجه للحصة الواحدة.", ar_fusha: "كل صف هو مشروب. كل عمود هو شيء نحتاجه للحصة الواحدة.", en: "Each row is a drink. Each column is something needed for one serving." }, language, arabicVariant)}
      </div>
    </div>
  );
}

function SharedLinkStage({ language, arabicVariant, savedState, relatedStates, onStateChange, onComplete }: InteractionComponentProps) {
  // Start with no selection so the screen always loads without any pre-marked choice.
  const [selected, setSelected] = useState("");

  // Reuse the orders the learner entered on the "من طلب وش؟" screen (cafe_orders).
  const savedOrders = relatedStates?.cafe_orders;
  const enteredOrders =
    savedOrders && savedOrders.ordersMode === "free-input-v2" && Array.isArray(savedOrders.orders)
      ? (savedOrders.orders as number[][])
      : [];
  const ordersValues = ORDER_PEOPLE.map((_, r) =>
    DRINKS.map((_, c) => (Number.isInteger(enteredOrders[r]?.[c]) ? enteredOrders[r][c] : DEMO_ORDERS[r][c]))
  );

  function choose(answer: string) {
    setSelected(answer);
    const completed = answer === "drinks";
    const state = { ...savedState, selected: answer, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }

  return (
    <div className="interaction-card matrix-lab cafe-link-stage">
      <div className="lab-columns">
        <div className="linked-matrix-panel">
          <strong>{t({ ar: "طلبات الأشخاص", ar_fusha: "طلبات الأشخاص", en: "People orders" }, language, arabicVariant)}</strong>
          <MatrixTable rows={ORDER_PEOPLE} cols={DRINKS} values={ordersValues} language={language} sharedCols={[0, 1]} />
        </div>
        <div className="matrix-connector" aria-hidden="true">
          <span>↔</span>
        </div>
        <div className="linked-matrix-panel">
          <strong>{t({ ar: "احتياج المشروبات", ar_fusha: "احتياج المشروبات", en: "Drink needs" }, language, arabicVariant)}</strong>
          <MatrixTable rows={DRINKS} cols={SUPPLIES} values={RECIPE} language={language} sharedRows={[0, 1]} labelColWidth="minmax(104px, 1.35fr)" />
        </div>
      </div>
      <div className="button-row">
        <button className="button" data-answer-state={selected === "drinks" ? "correct" : undefined} aria-pressed={selected === "drinks"} type="button" onClick={() => choose("drinks")}>{t({ ar: "المشروبات", ar_fusha: "المشروبات", en: "Drinks" }, language, arabicVariant)}</button>
        <button className="button" data-answer-state={selected === "people" ? "incorrect" : undefined} aria-pressed={selected === "people"} type="button" onClick={() => choose("people")}>{t({ ar: "الأشخاص", ar_fusha: "الأشخاص", en: "People" }, language, arabicVariant)}</button>
      </div>
      <div className="meaning-box" aria-live="polite">
        {selected === "drinks"
          ? t({ ar: "صحيح. أعمدة جدول الطلبات هي المشروبات، وصفوف جدول الاحتياج هي المشروبات. هنا تصير الوصلة.", ar_fusha: "صحيح. أعمدة جدول الطلبات هي المشروبات، وصفوف جدول الاحتياج هي المشروبات. هنا تكون الوصلة.", en: "Correct. The order columns are drinks, and the needs rows are drinks. That is the link." }, language, arabicVariant)
          : selected
            ? t({ ar: "الأشخاص موجودون في جدول الطلبات فقط. ابحث عن الكلمة التي تظهر في الجدولين.", ar_fusha: "الأشخاص موجودون في جدول الطلبات فقط. ابحث عن الكلمة التي تظهر في الجدولين.", en: "People appear only in the orders table. Look for the word that appears in both tables." }, language, arabicVariant)
            : t({ ar: "لاحظ الكلمات المميزة في الجدولين. أي كلمة تظهر في الاثنين؟", ar_fusha: "لاحظ الكلمات المميزة في الجدولين. أي كلمة تظهر في الاثنين؟", en: "Look at the highlighted words in both tables. Which word appears in both?" }, language, arabicVariant)}
      </div>
    </div>
  );
}
function RowColumnDemo({ language, arabicVariant, savedState, relatedStates, onStateChange, onComplete }: InteractionComponentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Always open from the start and auto-play; saved state only records completion.
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  // Reuse the orders the learner entered on the "من طلب وش؟" screen (cafe_orders).
  const savedOrders = relatedStates?.cafe_orders;
  const enteredOrders =
    savedOrders && savedOrders.ordersMode === "free-input-v2" && Array.isArray(savedOrders.orders)
      ? (savedOrders.orders as number[][])
      : [];
  const ordersValues = ORDER_PEOPLE.map((_, r) =>
    DRINKS.map((_, c) => (Number.isInteger(enteredOrders[r]?.[c]) ? enteredOrders[r][c] : DEMO_ORDERS[r][c]))
  );

  const products = [ordersValues[0][0] * RECIPE[0][0], ordersValues[0][1] * RECIPE[1][0]];
  const cupsTotal = products[0] + products[1];

  // Sub-phases within each step: 0 = numbers fly in, 1 = operator magnifies,
  // 2 = result appears. The intro step (0) is a single beat.
  const [sub, setSub] = useState(0);
  const finished = step >= 3 && sub >= 4;
  // When paused, show the current step fully composed instead of mid-flight.
  const viewSub = playing ? sub : step === 3 ? 4 : 2;

  // Animation speed: learners can slow it down or speed it up; normal is the default.
  const SPEEDS = {
    slow: { intro: 4000, fly: 2400, op: 1800, result: 1400 },
    normal: { intro: 2600, fly: 1500, op: 1100, result: 900 },
    fast: { intro: 1600, fly: 900, op: 700, result: 550 }
  } as const;
  const [speed, setSpeed] = useState<keyof typeof SPEEDS>("normal");
  const timing = SPEEDS[speed];

  function commit(next: InteractionState) {
    const nextStep = typeof next.step === "number" ? next.step : step;
    const nextSub = typeof next.sub === "number" ? next.sub : nextStep !== step ? 0 : sub;
    if (nextStep !== step) {
      setStep(nextStep);
    }
    setSub(nextSub);
    if (typeof next.playing === "boolean") setPlaying(next.playing);
    const completed = nextStep > 3 || (nextStep === 3 && nextSub >= 4);
    const state = { ...savedState, ...next, step: nextStep, sub: nextSub, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }

  // Choreography timer: intro -> fly-in -> operator -> result -> next step.
  useEffect(() => {
    if (!playing || finished) return;
    let delay: number;
    let action: () => void;
    if (step === 0) {
      delay = timing.intro;
      action = () => commit({ step: 1, playing: true });
    } else if (sub < 2) {
      delay = sub === 0 ? timing.fly : timing.op;
      action = () => setSub(sub + 1);
    } else if (step === 3 && sub === 2) {
      // Hold the final sum briefly, then send it to the output matrix.
      delay = timing.result;
      action = () => setSub(3);
    } else if (step === 3 && sub === 3) {
      delay = timing.fly;
      action = () => setSub(4);
    } else if (step === 3) {
      // Final result has landed in the output matrix.
      action = () => {
        commit({ playing: false });
      };
      delay = timing.result;
    } else {
      delay = timing.result;
      action = () => commit({ step: step + 1, playing: true });
    }
    const id = window.setTimeout(action, delay);
    return () => window.clearTimeout(id);
  });

  function togglePlay() {
    if (finished) {
      commit({ step: 0, playing: true });
    } else {
      commit({ playing: !playing });
    }
  }

  const orderActive = step === 1 ? "0-0" : step === 2 ? "0-1" : undefined;
  const recipeActive = step === 1 ? "0-0" : step === 2 ? "1-0" : undefined;

  // Reveal state per expression (1 = first product, 2 = second, 3 = sum).
  const exprState = (k: number) => {
    const revealed = step > k || (step === k && viewSub >= 1);
    const resultShown = step > k || (step === k && viewSub >= 2);
    const magnify = step === k && viewSub === 1;
    return { revealed, resultShown, magnify };
  };
  const e1 = exprState(1);
  const e2 = exprState(2);
  const e3 = exprState(3);
  const resultValues = [[viewSub >= 4 ? cupsTotal : "", "", ""], ["", "", ""]];

  // Flying numbers: launched when a step's fly-in phase starts.
  const [flyers, setFlyers] = useState<Array<{ id: string; value: number; tone: string; startX: number; startY: number; endX: number; endY: number }>>([]);
  useEffect(() => {
    if (!playing || (sub !== 0 && !(step === 3 && sub === 3)) || step === 0) {
      setFlyers([]);
      return;
    }
    const root = rootRef.current;
    if (!root) return;
    const rootBox = root.getBoundingClientRect();
    const center = (el: Element | null) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: b.left + b.width / 2 - rootBox.left, y: b.top + b.height / 2 - rootBox.top };
    };
    const grids = root.querySelectorAll(".lab-columns .matrix-grid");
    const pick = (g: Element | undefined, sel: string) => (g ? g.querySelector(sel) : null);
    const pickRoot = (sel: string) => root.querySelector(sel);
    let next: typeof flyers = [];
    if (step === 1) {
      const a = center(pick(grids[0], '[data-order-cell="0-0"]'));
      const b = center(pick(grids[1], '[data-order-cell="0-0"]'));
      const da = center(pickRoot('[data-mag-slot="m1-a"]'));
      const db = center(pickRoot('[data-mag-slot="m1-b"]'));
      if (a && b && da && db) {
        next = [
          { id: "f1a", value: ordersValues[0][0], tone: "fly-row", startX: a.x, startY: a.y, endX: da.x, endY: da.y },
          { id: "f1b", value: RECIPE[0][0], tone: "fly-col", startX: b.x, startY: b.y, endX: db.x, endY: db.y }
        ];
      }
    } else if (step === 2) {
      const a = center(pick(grids[0], '[data-order-cell="0-1"]'));
      const b = center(pick(grids[1], '[data-order-cell="1-0"]'));
      const da = center(pickRoot('[data-mag-slot="m2-a"]'));
      const db = center(pickRoot('[data-mag-slot="m2-b"]'));
      if (a && b && da && db) {
        next = [
          { id: "f2a", value: ordersValues[0][1], tone: "fly-row", startX: a.x, startY: a.y, endX: da.x, endY: da.y },
          { id: "f2b", value: RECIPE[1][0], tone: "fly-col", startX: b.x, startY: b.y, endX: db.x, endY: db.y }
        ];
      }
    } else if (step === 3 && sub === 0) {
      const a = center(pickRoot('[data-mag-slot="m1-r"]'));
      const b = center(pickRoot('[data-mag-slot="m2-r"]'));
      const da = center(pickRoot('[data-mag-slot="s-a"]'));
      const db = center(pickRoot('[data-mag-slot="s-b"]'));
      if (a && b && da && db) {
        next = [
          { id: "f3a", value: products[0], tone: "fly-prod", startX: a.x, startY: a.y, endX: da.x, endY: da.y },
          { id: "f3b", value: products[1], tone: "fly-prod", startX: b.x, startY: b.y, endX: db.x, endY: db.y }
        ];
      }
    } else if (step === 3 && sub === 3) {
      const start = center(pickRoot('[data-mag-slot="s-r"]'));
      const end = center(pickRoot('[data-result-cell="0-0"]'));
      if (start && end) {
        next = [{ id: "f4", value: cupsTotal, tone: "fly-total", startX: start.x, startY: start.y, endX: end.x, endY: end.y }];
      }
    }
    setFlyers(next);
  }, [step, sub, playing]);

  return (
    <div className="interaction-card matrix-lab cafe-row-column-stage" ref={rootRef}>
      <div className="lab-columns cafe-source-matrices">
        <div className="cafe-matrix-panel">
          <strong>{t({ ar: "طلبات الأشخاص", ar_fusha: "طلبات الأشخاص", en: "People orders" }, language, arabicVariant)}</strong>
          <MatrixTable rows={ORDER_PEOPLE} cols={DRINKS} values={ordersValues} language={language} highlightRow={step >= 0 ? 0 : undefined} activeCell={orderActive} />
        </div>
        <div className="cafe-matrix-panel">
          <strong>{t({ ar: "احتياج المشروبات", ar_fusha: "احتياجات المشروبات", en: "Drink needs" }, language, arabicVariant)}</strong>
          <MatrixTable rows={DRINKS} cols={SUPPLIES} values={RECIPE} language={language} highlightCol={step >= 0 ? 0 : undefined} activeCell={recipeActive} />
        </div>
      </div>
      <div className="calculation-strip" aria-live="polite">
        {step < 1 ? (
          <span>{t({ ar: "صف سارة × عمود الأكواب", ar_fusha: "صف سارة × عمود الأكواب", en: "Sara's row × the Cups column" }, language, arabicVariant)}</span>
        ) : null}
        {step >= 1 ? (
          <span className="math-expr" dir="ltr" data-magnify={e1.magnify ? "true" : undefined}>
            <span className="mag-num mag-row" data-mag-slot="m1-a" data-land={e1.revealed ? "true" : undefined}>{e1.revealed ? ordersValues[0][0] : ""}</span>
            <span className="mag-op" data-magnify={e1.magnify ? "true" : undefined}>×</span>
            <span className="mag-num mag-col" data-mag-slot="m1-b" data-land={e1.revealed ? "true" : undefined}>{e1.revealed ? RECIPE[0][0] : ""}</span>
            {" = "}
            <span className="mag-num mag-prod" data-mag-slot="m1-r" data-land={e1.resultShown ? "true" : undefined} data-transfer={step === 3 && viewSub === 0 ? "true" : undefined}>{e1.resultShown ? products[0] : ""}</span>
          </span>
        ) : null}
        {step >= 2 ? (
          <span className="math-expr" dir="ltr" data-magnify={e2.magnify ? "true" : undefined}>
            <span className="mag-num mag-row" data-mag-slot="m2-a" data-land={e2.revealed ? "true" : undefined}>{e2.revealed ? ordersValues[0][1] : ""}</span>
            <span className="mag-op" data-magnify={e2.magnify ? "true" : undefined}>×</span>
            <span className="mag-num mag-col" data-mag-slot="m2-b" data-land={e2.revealed ? "true" : undefined}>{e2.revealed ? RECIPE[1][0] : ""}</span>
            {" = "}
            <span className="mag-num mag-prod" data-mag-slot="m2-r" data-land={e2.resultShown ? "true" : undefined} data-transfer={step === 3 && viewSub === 0 ? "true" : undefined}>{e2.resultShown ? products[1] : ""}</span>
          </span>
        ) : null}
        {step >= 3 ? (
          <strong className="math-expr" dir="ltr" data-magnify={e3.magnify ? "true" : undefined}>
            <span className="mag-num mag-prod" data-mag-slot="s-a" data-land={e3.revealed ? "true" : undefined}>{e3.revealed ? products[0] : ""}</span>
            <span className="mag-op" data-magnify={e3.magnify ? "true" : undefined}>+</span>
            <span className="mag-num mag-prod" data-mag-slot="s-b" data-land={e3.revealed ? "true" : undefined}>{e3.revealed ? products[1] : ""}</span>
            {" = "}
            <span className="mag-num mag-total" data-mag-slot="s-r" data-land={e3.resultShown ? "true" : undefined}>{e3.resultShown ? cupsTotal : ""}</span>
          </strong>
        ) : null}
        <div className="calculation-explanation" aria-live="polite">
          {step < 1
            ? t({ ar: "نضرب كل زوج، ثم نجمع النواتج.", ar_fusha: "نضرب كل زوج، ثم نجمع النواتج.", en: "Multiply each pair, then add the products." }, language, arabicVariant)
            : step === 1
              ? viewSub === 0
                ? t({ ar: "نبدأ بالزوج الأول.", ar_fusha: "نبدأ بالزوج الأول.", en: "Start with the first pair." }, language, arabicVariant)
                : t({ ar: `الزوج الأول: ${ordersValues[0][0]} × ${RECIPE[0][0]} = ${products[0]}.`, ar_fusha: `الزوج الأول: ${ordersValues[0][0]} × ${RECIPE[0][0]} = ${products[0]}.`, en: `First pair: ${ordersValues[0][0]} × ${RECIPE[0][0]} = ${products[0]}.` }, language, arabicVariant)
              : step === 2
                ? viewSub === 0
                  ? t({ ar: "ننتقل للزوج الثاني.", ar_fusha: "ننتقل إلى الزوج الثاني.", en: "Move to the second pair." }, language, arabicVariant)
                  : t({ ar: `الزوج الثاني: ${ordersValues[0][1]} × ${RECIPE[1][0]} = ${products[1]}.`, ar_fusha: `الزوج الثاني: ${ordersValues[0][1]} × ${RECIPE[1][0]} = ${products[1]}.`, en: `Second pair: ${ordersValues[0][1]} × ${RECIPE[1][0]} = ${products[1]}.` }, language, arabicVariant)
                : viewSub === 0
                  ? t({ ar: "نجمع الناتجين.", ar_fusha: "نجمع ناتجي الضرب.", en: "Add the two products." }, language, arabicVariant)
                  : t({ ar: `الناتج: سارة تحتاج ${cupsTotal} كوب.`, ar_fusha: `الناتج: تحتاج سارة إلى ${cupsTotal} كوبًا.`, en: `Result: Sara needs ${cupsTotal} cups.` }, language, arabicVariant)}
        </div>
      </div>
      <div className="result-matrix-panel">
        <strong>{t({ ar: "وش يحتاج كل شخص؟", ar_fusha: "احتياجات كل شخص", en: "What Each Person Needs" }, language, arabicVariant)}</strong>
        <MatrixTable rows={ORDER_PEOPLE} cols={SUPPLIES} values={resultValues} language={language} activeCell={viewSub >= 4 ? "0-0" : undefined} resultTable />
      </div>
      {flyers.map((f) => (
        <span
          key={f.id}
          className={`mag-fly ${f.tone}`}
          onAnimationEnd={() => setFlyers((prev) => prev.filter((p) => p.id !== f.id))}
          style={{ "--start-x": `${f.startX}px`, "--start-y": `${f.startY}px`, "--end-x": `${f.endX}px`, "--end-y": `${f.endY}px`, animationDuration: `${timing.fly}ms` } as CSSProperties}
        >
          {f.value}
        </span>
      ))}
      <div className="button-row" aria-label={t({ ar: "أزرار العرض", ar_fusha: "أزرار العرض", en: "Animation controls" }, language, arabicVariant)}>
        <button className="icon-button" type="button" aria-label={playing && !finished ? t({ ar: "إيقاف", ar_fusha: "إيقاف", en: "Pause" }, language, arabicVariant) : t({ ar: "تشغيل", ar_fusha: "تشغيل", en: "Play" }, language, arabicVariant)} aria-pressed={playing && !finished} onClick={togglePlay}>
          {playing && !finished ? <IconPause /> : <IconPlay />}
        </button>
        <button className="icon-button" type="button" aria-label={t({ ar: "الخطوة السابقة", ar_fusha: "الخطوة السابقة", en: "Previous step" }, language, arabicVariant)} onClick={() => commit({ step: Math.max(0, step - 1), playing: false })}><IconPrev /></button>
        <button className="icon-button" type="button" aria-label={t({ ar: "الخطوة التالية", ar_fusha: "الخطوة التالية", en: "Next step" }, language, arabicVariant)} onClick={() => commit({ step: Math.min(3, step + 1), playing: false })}><IconNext /></button>
        <button className="icon-button" type="button" aria-label={t({ ar: "إعادة من البداية", ar_fusha: "إعادة من البداية", en: "Restart" }, language, arabicVariant)} onClick={() => commit({ step: 0, playing: true })}><IconRepeat /></button>
      </div>
      <div className="speed-row" aria-label={t({ ar: "سرعة العرض", ar_fusha: "سرعة العرض", en: "Animation speed" }, language, arabicVariant)}>
        <span className="speed-label">{t({ ar: "السرعة:", ar_fusha: "السرعة:", en: "Speed:" }, language, arabicVariant)}</span>
        {(["slow", "normal", "fast"] as const).map((option) => (
          <button
            key={option}
            className="speed-button"
            type="button"
            aria-pressed={speed === option}
            onClick={() => setSpeed(option)}
          >
            {t(
              { ar: option === "slow" ? "بطيء" : option === "normal" ? "عادي" : "سريع", ar_fusha: option === "slow" ? "بطيء" : option === "normal" ? "عادي" : "سريع", en: option === "slow" ? "Slow" : option === "normal" ? "Normal" : "Fast" },
              language,
              arabicVariant
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function AllRowsColumnsDemo({ language, arabicVariant, savedState, relatedStates, onStateChange, onComplete }: InteractionComponentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tasks = [{ row: 0, col: 1 }, { row: 0, col: 2 }];
  const savedOrders = relatedStates?.cafe_orders;
  const enteredOrders = savedOrders && savedOrders.ordersMode === "free-input-v2" && Array.isArray(savedOrders.orders) ? (savedOrders.orders as number[][]) : [];
  const ordersValues = ORDER_PEOPLE.map((_, r) => DRINKS.map((_, c) => Number.isInteger(enteredOrders[r]?.[c]) ? enteredOrders[r][c] : DEMO_ORDERS[r][c]));
  const [step, setStep] = useState(0);
  const [sub, setSub] = useState(0);
  const [playing, setPlaying] = useState(true);
  const SPEEDS = { slow: { fly: 2400, op: 1800, result: 1400 }, normal: { fly: 1500, op: 1100, result: 900 }, fast: { fly: 900, op: 700, result: 550 } } as const;
  const [speed, setSpeed] = useState<keyof typeof SPEEDS>("normal");
  const timing = SPEEDS[speed];
  const task = tasks[step];
  const first = ordersValues[task.row][0] * RECIPE[0][task.col];
  const second = ordersValues[task.row][1] * RECIPE[1][task.col];
  const total = first + second;
  const finished = step === tasks.length - 1 && sub === 10;
  const viewSub = playing ? sub : 10;
  const e1 = { revealed: viewSub >= 1, resultShown: viewSub >= 2, magnify: viewSub === 1 };
  const e2 = { revealed: viewSub >= 4, resultShown: viewSub >= 5, magnify: viewSub === 4 };
  const e3 = { revealed: viewSub >= 7, resultShown: viewSub >= 8, magnify: viewSub === 7 };
  // Keep Sara's completed result from the previous demo visible as the starting
  // point, then accumulate each result as the remaining cells land.
  const previousTotal = ordersValues[0][0] * RECIPE[0][0] + ordersValues[0][1] * RECIPE[1][0];
  const resultValues = ORDER_PEOPLE.map((_, row) => SUPPLIES.map((_, col) => {
    if (row === 0 && col === 0) return previousTotal;
    const taskIndex = tasks.findIndex((item) => item.row === row && item.col === col);
    if (taskIndex >= 0 && taskIndex < step) {
      return ordersValues[row][0] * RECIPE[0][col] + ordersValues[row][1] * RECIPE[1][col];
    }
    return row === task.row && col === task.col && viewSub >= 10 ? total : "";
  }));

  function commit(nextStep: number, nextSub: number, nextPlaying: boolean, completed = false) {
    setStep(nextStep);
    setSub(nextSub);
    setPlaying(nextPlaying);
    const state = { ...savedState, step: nextStep, sub: nextSub, playing: nextPlaying, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }

  useEffect(() => {
    if (!playing) return;
    const delay = [0, 3, 6, 9].includes(sub) ? timing.fly : [1, 4, 7].includes(sub) ? timing.op : timing.result;
    const id = window.setTimeout(() => {
      if (sub < 10) {
        setSub(sub + 1);
      } else if (step < tasks.length - 1) {
        setStep(step + 1);
        setSub(0);
      } else {
        commit(step, 10, false, true);
      }
    }, delay);
    return () => window.clearTimeout(id);
  }, [playing, step, sub, speed]);

  const [flyers, setFlyers] = useState<Array<{ id: string; value: number; tone: string; startX: number; startY: number; endX: number; endY: number }>>([]);
  useEffect(() => {
    if (!playing || ![0, 3, 6, 9].includes(sub)) {
      setFlyers([]);
      return;
    }
    const root = rootRef.current;
    if (!root) return;
    const rootBox = root.getBoundingClientRect();
    const center = (element: Element | null) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.left + box.width / 2 - rootBox.left, y: box.top + box.height / 2 - rootBox.top };
    };
    const grids = root.querySelectorAll(".lab-columns .matrix-grid");
    const pick = (grid: Element | undefined, selector: string) => grid?.querySelector(selector) ?? null;
    const target = (slot: string) => root.querySelector(`[data-mag-slot="${slot}"]`);
    const pairFlyers = (a: Element | null, b: Element | null, da: Element | null, db: Element | null, prefix: string, values: [number, number]) => {
      const startA = center(a); const startB = center(b); const endA = center(da); const endB = center(db);
      if (!startA || !startB || !endA || !endB) return [];
      return [
        { id: `${prefix}-a`, value: values[0], tone: "fly-row", startX: startA.x, startY: startA.y, endX: endA.x, endY: endA.y },
        { id: `${prefix}-b`, value: values[1], tone: "fly-col", startX: startB.x, startY: startB.y, endX: endB.x, endY: endB.y }
      ];
    };
    let next: typeof flyers = [];
    if (sub === 0) next = pairFlyers(pick(grids[0], `[data-order-cell="${task.row}-0"]`), pick(grids[1], `[data-order-cell="0-${task.col}"]`), target("p1-a"), target("p1-b"), `${step}-p1`, [ordersValues[task.row][0], RECIPE[0][task.col]]);
    else if (sub === 3) next = pairFlyers(pick(grids[0], `[data-order-cell="${task.row}-1"]`), pick(grids[1], `[data-order-cell="1-${task.col}"]`), target("p2-a"), target("p2-b"), `${step}-p2`, [ordersValues[task.row][1], RECIPE[1][task.col]]);
    else if (sub === 6) {
      const startA = center(target("p1-r")); const startB = center(target("p2-r")); const endA = center(target("s-a")); const endB = center(target("s-b"));
      if (startA && startB && endA && endB) next = [
        { id: `${step}-s-a`, value: first, tone: "fly-prod", startX: startA.x, startY: startA.y, endX: endA.x, endY: endA.y },
        { id: `${step}-s-b`, value: second, tone: "fly-prod", startX: startB.x, startY: startB.y, endX: endB.x, endY: endB.y }
      ];
    } else {
      const start = center(target("s-r"));
      const end = center(root.querySelector(`[data-result-cell="${task.row}-${task.col}"]`));
      if (start && end) next = [{ id: `${step}-final`, value: total, tone: "fly-total", startX: start.x, startY: start.y, endX: end.x, endY: end.y }];
    }
    setFlyers(next);
  }, [playing, step, sub]);

  function togglePlay() {
    if (finished) commit(0, 0, true);
    else setPlaying(!playing);
  }

  return (
    <div className="interaction-card matrix-lab cafe-row-column-stage cafe-all-columns-stage" ref={rootRef}>
      <div className="lab-columns cafe-source-matrices">
        <div className="cafe-matrix-panel">
          <strong>{t({ ar: "طلبات الأشخاص", ar_fusha: "طلبات الأشخاص", en: "People orders" }, language, arabicVariant)}</strong>
          <MatrixTable rows={ORDER_PEOPLE} cols={DRINKS} values={ordersValues} language={language} highlightRow={task.row} />
        </div>
        <div className="cafe-matrix-panel">
          <strong>{t({ ar: "احتياج المشروبات", ar_fusha: "احتياجات المشروبات", en: "Drink needs" }, language, arabicVariant)}</strong>
          <MatrixTable rows={DRINKS} cols={SUPPLIES} values={RECIPE} language={language} highlightCol={task.col} />
        </div>
      </div>
      <div className="calculation-strip all-pair-calculation" aria-live="polite">
        <span className="math-expr" dir="ltr" data-magnify={e1.magnify ? "true" : undefined}>
          <span className="mag-num mag-row" data-mag-slot="p1-a" data-land={e1.revealed ? "true" : undefined}>{e1.revealed ? ordersValues[task.row][0] : ""}</span><span className="mag-op" data-magnify={e1.magnify ? "true" : undefined}>×</span><span className="mag-num mag-col" data-mag-slot="p1-b" data-land={e1.revealed ? "true" : undefined}>{e1.revealed ? RECIPE[0][task.col] : ""}</span><span className="mag-op">=</span><span className="mag-num mag-prod" data-mag-slot="p1-r" data-land={e1.resultShown ? "true" : undefined} data-transfer={sub === 6 ? "true" : undefined}>{e1.resultShown ? first : ""}</span>
        </span>
        <span className="math-expr" dir="ltr" data-magnify={e2.magnify ? "true" : undefined}>
          <span className="mag-num mag-row" data-mag-slot="p2-a" data-land={e2.revealed ? "true" : undefined}>{e2.revealed ? ordersValues[task.row][1] : ""}</span><span className="mag-op" data-magnify={e2.magnify ? "true" : undefined}>×</span><span className="mag-num mag-col" data-mag-slot="p2-b" data-land={e2.revealed ? "true" : undefined}>{e2.revealed ? RECIPE[1][task.col] : ""}</span><span className="mag-op">=</span><span className="mag-num mag-prod" data-mag-slot="p2-r" data-land={e2.resultShown ? "true" : undefined} data-transfer={sub === 6 ? "true" : undefined}>{e2.resultShown ? second : ""}</span>
        </span>
        <strong className="math-expr" dir="ltr" data-magnify={e3.magnify ? "true" : undefined}>
          <span className="mag-num mag-prod" data-mag-slot="s-a" data-land={e3.revealed ? "true" : undefined}>{e3.revealed ? first : ""}</span><span className="mag-op" data-magnify={e3.magnify ? "true" : undefined}>+</span><span className="mag-num mag-prod" data-mag-slot="s-b" data-land={e3.revealed ? "true" : undefined}>{e3.revealed ? second : ""}</span><span className="mag-op">=</span><span className="mag-num mag-total" data-mag-slot="s-r" data-land={e3.resultShown ? "true" : undefined}>{e3.resultShown ? total : ""}</span>
        </strong>
        <div className="calculation-explanation" aria-live="polite">
          {t({ ar: "نكمّل بنفس الخطوتين: نضرب، ثم نجمع.", ar_fusha: "نكرّر الخطوتين: نضرب، ثم نجمع النواتج.", en: "Repeat the two steps: multiply, then add." }, language, arabicVariant)}
        </div>
      </div>
      <div className="result-matrix-panel">
        <strong>{t({ ar: "وش يحتاج كل شخص؟", ar_fusha: "احتياجات كل شخص", en: "What Each Person Needs" }, language, arabicVariant)}</strong>
        <MatrixTable rows={ORDER_PEOPLE} cols={SUPPLIES} values={resultValues} language={language} activeCell={viewSub >= 10 ? `${task.row}-${task.col}` : undefined} resultTable />
      </div>
      {flyers.map((flyer) => <span key={flyer.id} className={`mag-fly ${flyer.tone}`} onAnimationEnd={() => setFlyers((current) => current.filter((item) => item.id !== flyer.id))} style={{ "--start-x": `${flyer.startX}px`, "--start-y": `${flyer.startY}px`, "--end-x": `${flyer.endX}px`, "--end-y": `${flyer.endY}px`, animationDuration: `${timing.fly}ms` } as CSSProperties}>{flyer.value}</span>)}
      <div className="all-pair-progress" aria-live="polite">{t({ ar: `الخلية ${step + 1} من ${tasks.length}: ${label(ORDER_PEOPLE[task.row], language)} × ${label(SUPPLIES[task.col], language)}`, ar_fusha: `الخلية ${step + 1} من ${tasks.length}: ${label(ORDER_PEOPLE[task.row], language)} × ${label(SUPPLIES[task.col], language)}`, en: `Cell ${step + 1} of ${tasks.length}: ${label(ORDER_PEOPLE[task.row], language)} × ${label(SUPPLIES[task.col], language)}` }, language, arabicVariant)}</div>
      <div className="cafe-animation-controls">
      <div className="button-row" aria-label={t({ ar: "أزرار العرض", ar_fusha: "أزرار العرض", en: "Animation controls" }, language, arabicVariant)}>
        <button className="icon-button" type="button" aria-label={playing && !finished ? t({ ar: "إيقاف", ar_fusha: "إيقاف", en: "Pause" }, language, arabicVariant) : t({ ar: "تشغيل", ar_fusha: "تشغيل", en: "Play" }, language, arabicVariant)} aria-pressed={playing && !finished} onClick={togglePlay}>{playing && !finished ? <IconPause /> : <IconPlay />}</button>
        <button className="icon-button" type="button" aria-label={t({ ar: "النتيجة السابقة", ar_fusha: "النتيجة السابقة", en: "Previous result" }, language, arabicVariant)} onClick={() => commit(Math.max(0, step - 1), 8, false)}><IconPrev /></button>
        <button className="icon-button" type="button" aria-label={t({ ar: "النتيجة التالية", ar_fusha: "النتيجة التالية", en: "Next result" }, language, arabicVariant)} onClick={() => commit(Math.min(tasks.length - 1, step + 1), 0, false)}><IconNext /></button>
        <button className="icon-button" type="button" aria-label={t({ ar: "إعادة", ar_fusha: "إعادة", en: "Restart" }, language, arabicVariant)} onClick={() => commit(0, 0, true)}><IconRepeat /></button>
      </div>
      <div className="speed-row" aria-label={t({ ar: "سرعة العرض", ar_fusha: "سرعة العرض", en: "Animation speed" }, language, arabicVariant)}><span className="speed-label">{t({ ar: "السرعة:", ar_fusha: "السرعة:", en: "Speed:" }, language, arabicVariant)}</span>{(["slow", "normal", "fast"] as const).map((option) => <button key={option} className="speed-button" type="button" aria-pressed={speed === option} onClick={() => setSpeed(option)}>{t({ ar: option === "slow" ? "بطيء" : option === "normal" ? "عادي" : "سريع", ar_fusha: option === "slow" ? "بطيء" : option === "normal" ? "عادي" : "سريع", en: option[0].toUpperCase() + option.slice(1) }, language, arabicVariant)}</button>)}</div>
      </div>
    </div>
  );
}

type PracticeAnswer = { first: number; second: number; total: number };
type PracticeAnswers = Record<string, PracticeAnswer>;

function RowColumnPractice({ language, arabicVariant, savedState, relatedStates, onStateChange, onComplete }: InteractionComponentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const savedOrders = relatedStates?.cafe_orders;
  const enteredOrders = savedOrders && savedOrders.ordersMode === "free-input-v2" && Array.isArray(savedOrders.orders) ? (savedOrders.orders as number[][]) : [];
  const ordersValues = ORDER_PEOPLE.map((_, r) => DRINKS.map((_, c) => Number.isInteger(enteredOrders[r]?.[c]) ? enteredOrders[r][c] : DEMO_ORDERS[r][c]));
  const hasCurrentPracticeState = savedState.practiceStateVersion === PRACTICE_STATE_VERSION;
  const rawSavedAnswers = hasCurrentPracticeState ? savedState.practiceAnswers : undefined;
  const savedAnswers = rawSavedAnswers && typeof rawSavedAnswers === "object" && !Array.isArray(rawSavedAnswers) ? rawSavedAnswers as PracticeAnswers : {};
  const initialTask = hasCurrentPracticeState && typeof savedState.practiceTask === "number" ? Math.min(PRACTICE_TASKS.length - 1, Math.max(0, savedState.practiceTask)) : 0;
  const initialPhase = hasCurrentPracticeState && typeof savedState.practicePhase === "number" ? Math.max(0, Math.min(7, savedState.practicePhase)) : 0;
  const [answers, setAnswers] = useState<PracticeAnswers>(savedAnswers);
  const [taskIndex, setTaskIndex] = useState(initialTask);
  const [phase, setPhase] = useState(initialPhase);
  const [playing, setPlaying] = useState(initialPhase === 0 || initialPhase === 2 || initialPhase === 4 || initialPhase === 6);
  const [draft, setDraft] = useState({ first: "", second: "", total: "" });
  const [feedback, setFeedback] = useState("");
  const task = PRACTICE_TASKS[taskIndex];
  const first = ordersValues[task.row][0] * RECIPE[0][task.col];
  const second = ordersValues[task.row][1] * RECIPE[1][task.col];
  const total = first + second;
  const timing = { fly: 1500, result: 900 };

  function writeProgress(next: { taskIndex?: number; phase?: number; playing?: boolean; practiceAnswers?: PracticeAnswers; completed?: boolean }) {
    onStateChange({
      ...savedState,
      practiceStateVersion: PRACTICE_STATE_VERSION,
      practiceTask: next.taskIndex ?? taskIndex,
      practicePhase: next.phase ?? phase,
      practicePlaying: next.playing ?? playing,
      practiceAnswers: next.practiceAnswers ?? answers,
      completed: next.completed ?? false
    });
  }

  useEffect(() => {
    const current = answers[`${task.row}-${task.col}`];
    setDraft(current ? { first: String(current.first), second: String(current.second), total: String(current.total) } : { first: "", second: "", total: "" });
    setFeedback("");
  }, [taskIndex]);

  useEffect(() => {
    if (!playing || ![0, 2, 4, 6].includes(phase)) return;
    const delay = timing.fly;
    const id = window.setTimeout(() => {
      if (phase === 0) {
        setPhase(1);
        setPlaying(false);
        writeProgress({ phase: 1, playing: false });
      } else if (phase === 2) {
        setPhase(3);
        setPlaying(false);
        writeProgress({ phase: 3, playing: false });
      } else if (phase === 4) {
        setPhase(5);
        setPlaying(false);
        writeProgress({ phase: 5, playing: false });
      } else {
        const key = `${task.row}-${task.col}`;
        const nextAnswers = { ...answers, [key]: { first, second, total } };
        setAnswers(nextAnswers);
        if (taskIndex < PRACTICE_TASKS.length - 1) {
          setTaskIndex(taskIndex + 1);
          setPhase(0);
          setPlaying(true);
          writeProgress({ taskIndex: taskIndex + 1, phase: 0, playing: true, practiceAnswers: nextAnswers });
        } else {
          setPhase(7);
          setPlaying(false);
          const state = {
            ...savedState,
            practiceStateVersion: PRACTICE_STATE_VERSION,
            practiceTask: taskIndex,
            practicePhase: 7,
            practicePlaying: false,
            practiceAnswers: nextAnswers,
            completed: true
          };
          onStateChange(state);
          onComplete(state);
        }
      }
    }, delay);
    return () => window.clearTimeout(id);
  }, [playing, phase, taskIndex]);

  const [flyers, setFlyers] = useState<Array<{ id: string; value: number; tone: string; startX: number; startY: number; endX: number; endY: number }>>([]);
  useEffect(() => {
    if (!playing || ![0, 2, 4, 6].includes(phase)) {
      setFlyers([]);
      return;
    }
    const root = rootRef.current;
    if (!root) return;
    const rootBox = root.getBoundingClientRect();
    const center = (element: Element | null) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.left + box.width / 2 - rootBox.left, y: box.top + box.height / 2 - rootBox.top };
    };
    const source = (selector: string) => center(root.querySelector(selector));
    const target = (slot: string) => center(root.querySelector(`[data-practice-slot="${slot}"]`));
    const grids = root.querySelectorAll(".cafe-source-matrices .matrix-grid");
    const pick = (grid: Element | undefined, selector: string) => grid?.querySelector(selector) ?? null;
    let next: typeof flyers = [];
    if (phase === 0) {
      const a = center(pick(grids[0], `[data-order-cell="1-0"]`));
      const b = center(pick(grids[1], `[data-order-cell="0-${task.col}"]`));
      const da = target("first-a");
      const db = target("first-b");
      if (a && b && da && db) next = [
        { id: `${taskIndex}-first-a`, value: ordersValues[1][0], tone: "fly-row", startX: a.x, startY: a.y, endX: da.x, endY: da.y },
        { id: `${taskIndex}-first-b`, value: RECIPE[0][task.col], tone: "fly-col", startX: b.x, startY: b.y, endX: db.x, endY: db.y }
      ];
    } else if (phase === 2) {
      const a = center(pick(grids[0], `[data-order-cell="1-1"]`));
      const b = center(pick(grids[1], `[data-order-cell="1-${task.col}"]`));
      const da = target("second-a");
      const db = target("second-b");
      if (a && b && da && db) next = [
        { id: `${taskIndex}-second-a`, value: ordersValues[1][1], tone: "fly-row", startX: a.x, startY: a.y, endX: da.x, endY: da.y },
        { id: `${taskIndex}-second-b`, value: RECIPE[1][task.col], tone: "fly-col", startX: b.x, startY: b.y, endX: db.x, endY: db.y }
      ];
    } else if (phase === 4) {
      const startA = source(`[data-practice-slot="first-result"]`);
      const startB = source(`[data-practice-slot="second-result"]`);
      const endA = target("sum-first");
      const endB = target("sum-second");
      if (startA && startB && endA && endB) next = [
        { id: `${taskIndex}-sum-a`, value: first, tone: "fly-prod", startX: startA.x, startY: startA.y, endX: endA.x, endY: endA.y },
        { id: `${taskIndex}-sum-b`, value: second, tone: "fly-prod", startX: startB.x, startY: startB.y, endX: endB.x, endY: endB.y }
      ];
    } else {
      const start = source(`[data-practice-slot="total"]`);
      const end = source(`[data-result-cell="1-${task.col}"]`);
      if (start && end) next = [{ id: `${taskIndex}-total`, value: total, tone: "fly-total", startX: start.x, startY: start.y, endX: end.x, endY: end.y }];
    }
    setFlyers(next);
  }, [playing, phase, taskIndex]);

  function checkAnswer(kind: "first" | "second" | "total") {
    const value = Number(draft[kind]);
    const expected = kind === "first" ? first : kind === "second" ? second : total;
    if (!draft[kind].trim() || !Number.isFinite(value) || value !== expected) {
      const hint = kind === "total" ? `${first} + ${second}` : kind === "first" ? `${ordersValues[1][0]} × ${RECIPE[0][task.col]}` : `${ordersValues[1][1]} × ${RECIPE[1][task.col]}`;
      setFeedback(t({ ar: `جرّب مرة ثانية: احسب ${hint}.`, ar_fusha: `حاول مرة أخرى: احسب ${hint}.`, en: `Try again: calculate ${hint}.` }, language, arabicVariant));
      return;
    }
    setFeedback("");
    if (kind === "first") {
      setPhase(2);
      setPlaying(true);
      writeProgress({ phase: 2, playing: true });
    } else if (kind === "second") {
      setPhase(4);
      setPlaying(true);
      writeProgress({ phase: 4, playing: true });
    } else {
      setPhase(6);
      setPlaying(true);
      writeProgress({ phase: 6, playing: true });
    }
  }

  function resetPractice() {
    const nextAnswers: PracticeAnswers = {};
    setAnswers(nextAnswers);
    setTaskIndex(0);
    setDraft({ first: "", second: "", total: "" });
    setFeedback("");
    setPhase(0);
    setPlaying(true);
    writeProgress({ taskIndex: 0, phase: 0, playing: true, practiceAnswers: nextAnswers, completed: false });
  }

  const saraResults = SUPPLIES.map((_, col) => ordersValues[0][0] * RECIPE[0][col] + ordersValues[0][1] * RECIPE[1][col]);
  const fahadResults = SUPPLIES.map((_, col) => answers[`1-${col}`]?.total ?? "");
  const resultValues = [saraResults, fahadResults];
  const currentAnswerKind = phase === 1 ? "first" : phase === 3 ? "second" : phase === 5 ? "total" : null;
  const phaseComment = phase === 0
    ? t({ ar: "شاهد الزوج الأول وهو يدخل عملية الضرب.", ar_fusha: "شاهد الزوج الأول وهو ينتقل إلى عملية الضرب.", en: "Watch the first pair move into the multiplication." }, language, arabicVariant)
    : phase === 1
      ? t({ ar: "احسب ناتج الضرب الأول.", ar_fusha: "احسب ناتج الضرب الأول.", en: "Calculate the first product." }, language, arabicVariant)
      : phase === 2
        ? t({ ar: "ممتاز. نأخذ الزوج الثاني.", ar_fusha: "أحسنت. ننتقل إلى الزوج الثاني.", en: "Good. Move to the second pair." }, language, arabicVariant)
        : phase === 3
          ? t({ ar: "احسب ناتج الضرب الثاني.", ar_fusha: "احسب ناتج الضرب الثاني.", en: "Calculate the second product." }, language, arabicVariant)
          : phase === 4
            ? t({ ar: "شاهد ناتجي الضرب وهما ينتقلان للجمع.", ar_fusha: "شاهد ناتجي الضرب وهما ينتقلان إلى عملية الجمع.", en: "Watch both products move into the addition." }, language, arabicVariant)
            : phase === 5
              ? t({ ar: "الحين اجمع الناتجين.", ar_fusha: "الآن اجمع ناتجي الضرب.", en: "Now add the two products." }, language, arabicVariant)
              : phase === 6
                ? t({ ar: "صح. الناتج رايح لخلية فهد.", ar_fusha: "صحيح. ينتقل الناتج إلى خلية فهد.", en: "Correct. The result moves to Fahad's cell." }, language, arabicVariant)
                : t({ ar: "ممتاز. حسبت خلايا فهد كلها.", ar_fusha: "أحسنت. حسبت خلايا فهد كلها.", en: "Great. You calculated all of Fahad's cells." }, language, arabicVariant);

  return (
    <div className="interaction-card matrix-lab cafe-row-column-stage cafe-practice-stage" ref={rootRef}>
      <div className="lab-columns cafe-source-matrices">
        <div className="cafe-matrix-panel">
          <strong>{t({ ar: "طلبات الأشخاص", ar_fusha: "طلبات الأشخاص", en: "People orders" }, language, arabicVariant)}</strong>
          <MatrixTable rows={ORDER_PEOPLE} cols={DRINKS} values={ordersValues} language={language} highlightRow={1} />
        </div>
        <div className="cafe-matrix-panel">
          <strong>{t({ ar: "احتياج المشروبات", ar_fusha: "احتياجات المشروبات", en: "Drink needs" }, language, arabicVariant)}</strong>
          <MatrixTable rows={DRINKS} cols={SUPPLIES} values={RECIPE} language={language} highlightCol={task.col} />
        </div>
      </div>
      <div className="calculation-strip practice-calculation" aria-live="polite">
        {phase >= 0 ? (
          <span className="math-expr" dir="ltr">
            <span className="mag-num mag-row" data-practice-slot="first-a" data-land={phase >= 1 ? "true" : undefined}>{phase >= 1 ? ordersValues[1][0] : ""}</span>
            <span className="mag-op">×</span>
            <span className="mag-num mag-col" data-practice-slot="first-b" data-land={phase >= 1 ? "true" : undefined}>{phase >= 1 ? RECIPE[0][task.col] : ""}</span>
            <span className="mag-op">=</span>
            {phase === 1 ? <input className="mag-num mag-prod practice-answer-input" inputMode="numeric" aria-label={t({ ar: "ناتج الضرب الأول", ar_fusha: "ناتج الضرب الأول", en: "First product" }, language, arabicVariant)} value={draft.first} onChange={(event) => setDraft({ ...draft, first: event.currentTarget.value })} /> : <span className="mag-num mag-prod" data-practice-slot="first-result" data-land={phase >= 2 ? "true" : undefined} data-transfer={phase === 4 ? "true" : undefined}>{phase >= 2 ? draft.first : ""}</span>}
          </span>
        ) : null}
        {phase >= 2 ? (
          <span className="math-expr" dir="ltr">
            <span className="mag-num mag-row" data-practice-slot="second-a" data-land={phase >= 3 ? "true" : undefined}>{phase >= 3 ? ordersValues[1][1] : ""}</span>
            <span className="mag-op">×</span>
            <span className="mag-num mag-col" data-practice-slot="second-b" data-land={phase >= 3 ? "true" : undefined}>{phase >= 3 ? RECIPE[1][task.col] : ""}</span>
            <span className="mag-op">=</span>
            {phase === 3 ? <input className="mag-num mag-prod practice-answer-input" inputMode="numeric" aria-label={t({ ar: "ناتج الضرب الثاني", ar_fusha: "ناتج الضرب الثاني", en: "Second product" }, language, arabicVariant)} value={draft.second} onChange={(event) => setDraft({ ...draft, second: event.currentTarget.value })} /> : <span className="mag-num mag-prod" data-practice-slot="second-result" data-land={phase >= 4 ? "true" : undefined} data-transfer={phase === 4 ? "true" : undefined}>{phase >= 4 ? draft.second : ""}</span>}
          </span>
        ) : null}
        {phase >= 4 ? (
          <strong className="math-expr" dir="ltr">
            <span className="mag-num mag-prod" data-practice-slot="sum-first" data-land={phase >= 5 ? "true" : undefined}>{phase >= 5 ? draft.first : ""}</span>
            <span className="mag-op">+</span>
            <span className="mag-num mag-prod" data-practice-slot="sum-second" data-land={phase >= 5 ? "true" : undefined}>{phase >= 5 ? draft.second : ""}</span>
            <span className="mag-op">=</span>
            {phase === 5 ? <input className="mag-num mag-total practice-answer-input" inputMode="numeric" aria-label={t({ ar: "قيمة الخلية", ar_fusha: "قيمة الخلية", en: "Cell value" }, language, arabicVariant)} value={draft.total} onChange={(event) => setDraft({ ...draft, total: event.currentTarget.value })} /> : <span className="mag-num mag-total" data-practice-slot="total" data-land={phase >= 6 ? "true" : undefined}>{phase >= 6 ? draft.total : ""}</span>}
          </strong>
        ) : null}
        <div className="calculation-explanation" aria-live="polite">{phaseComment}</div>
      </div>
      {currentAnswerKind ? (
        <div className="practice-answer-row">
          <button className="button primary" type="button" onClick={() => checkAnswer(currentAnswerKind)}>{t({ ar: "تحقق", ar_fusha: "تحقق", en: "Check" }, language, arabicVariant)}</button>
          {feedback ? <span className="practice-feedback" role="alert">{feedback}</span> : null}
        </div>
      ) : null}
      <div className="result-matrix-panel">
        <strong>{t({ ar: "وش يحتاج كل شخص؟", ar_fusha: "احتياجات كل شخص", en: "What Each Person Needs" }, language, arabicVariant)}</strong>
        <MatrixTable rows={ORDER_PEOPLE} cols={SUPPLIES} values={resultValues} language={language} activeCell={phase === 7 ? `1-${task.col}` : undefined} resultTable />
      </div>
      {flyers.map((flyer) => <span key={flyer.id} className={`mag-fly ${flyer.tone}`} onAnimationEnd={() => setFlyers((current) => current.filter((item) => item.id !== flyer.id))} style={{ "--start-x": `${flyer.startX}px`, "--start-y": `${flyer.startY}px`, "--end-x": `${flyer.endX}px`, "--end-y": `${flyer.endY}px`, animationDuration: `${timing.fly}ms` } as CSSProperties}>{flyer.value}</span>)}
      <div className="practice-progress" aria-live="polite">{t({ ar: `خلية فهد ${taskIndex + 1} من ${PRACTICE_TASKS.length}: ${label(SUPPLIES[task.col], language)}`, ar_fusha: `خلية فهد ${taskIndex + 1} من ${PRACTICE_TASKS.length}: ${label(SUPPLIES[task.col], language)}`, en: `Fahad's cell ${taskIndex + 1} of ${PRACTICE_TASKS.length}: ${label(SUPPLIES[task.col], language)}` }, language, arabicVariant)}</div>
      <div className="practice-controls">
        <button className="icon-button" type="button" aria-label={t({ ar: "إعادة التمرين", ar_fusha: "إعادة التمرين", en: "Restart exercise" }, language, arabicVariant)} title={t({ ar: "إعادة التمرين", ar_fusha: "إعادة التمرين", en: "Restart exercise" }, language, arabicVariant)} onClick={resetPractice}><IconRepeat /></button>
      </div>
    </div>
  );
}


function MultiplicationRevision({ language, arabicVariant, relatedStates }: InteractionComponentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const savedOrders = relatedStates?.cafe_orders;
  const enteredOrders = savedOrders && savedOrders.ordersMode === "free-input-v2" && Array.isArray(savedOrders.orders) ? (savedOrders.orders as number[][]) : [];
  const ordersValues = ORDER_PEOPLE.map((_, r) => DRINKS.map((_, c) => Number.isInteger(enteredOrders[r]?.[c]) ? enteredOrders[r][c] : DEMO_ORDERS[r][c]));
  const tasks = ORDER_PEOPLE.flatMap((_, row) => SUPPLIES.map((_, col) => ({ row, col })));
  const [taskIndex, setTaskIndex] = useState(0);
  const [phase, setPhase] = useState(0);
  const task = tasks[taskIndex];
  const first = ordersValues[task.row][0] * RECIPE[0][task.col];
  const second = ordersValues[task.row][1] * RECIPE[1][task.col];
  const total = first + second;
  const timing = { fly: 650, process: 420, result: 650, hold: 850 };
  const sourceRowCell = phase <= 1 ? `${task.row}-0` : phase <= 3 ? `${task.row}-1` : undefined;
  const sourceRecipeCell = phase <= 1 ? `0-${task.col}` : phase <= 3 ? `1-${task.col}` : undefined;

  useEffect(() => {
    const delay = phase === 6 ? timing.result : phase === 7 ? timing.hold : [0, 2, 4].includes(phase) ? timing.fly : timing.process;
    const id = window.setTimeout(() => {
      if (phase === 7) {
        setTaskIndex((current) => (current + 1) % tasks.length);
        setPhase(0);
      } else {
        setPhase(phase + 1);
      }
    }, delay);
    return () => window.clearTimeout(id);
  }, [phase, taskIndex, tasks.length]);

  const [flyers, setFlyers] = useState<Array<{ id: string; value: number; tone: string; startX: number; startY: number; endX: number; endY: number }>>([]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || ![0, 2, 4, 6].includes(phase)) {
      setFlyers([]);
      return;
    }
    const rootBox = root.getBoundingClientRect();
    const center = (element: Element | null) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.left + box.width / 2 - rootBox.left, y: box.top + box.height / 2 - rootBox.top };
    };
    const grids = root.querySelectorAll(".cafe-source-matrices .matrix-grid");
    const pick = (grid: Element | undefined, selector: string) => grid?.querySelector(selector) ?? null;
    const target = (slot: string) => root.querySelector(`[data-revision-slot="${slot}"]`);
    const pair = (a: Element | null, b: Element | null, da: Element | null, db: Element | null, prefix: string, values: [number, number], tone: [string, string]) => {
      const startA = center(a); const startB = center(b); const endA = center(da); const endB = center(db);
      if (!startA || !startB || !endA || !endB) return [];
      return [
        { id: `${prefix}-a`, value: values[0], tone: tone[0], startX: startA.x, startY: startA.y, endX: endA.x, endY: endA.y },
        { id: `${prefix}-b`, value: values[1], tone: tone[1], startX: startB.x, startY: startB.y, endX: endB.x, endY: endB.y }
      ];
    };
    let next: typeof flyers = [];
    if (phase === 0) next = pair(pick(grids[0], `[data-order-cell="${task.row}-0"]`), pick(grids[1], `[data-order-cell="0-${task.col}"]`), target("first-a"), target("first-b"), `${taskIndex}-first`, [ordersValues[task.row][0], RECIPE[0][task.col]], ["fly-row", "fly-col"]);
    else if (phase === 2) next = pair(pick(grids[0], `[data-order-cell="${task.row}-1"]`), pick(grids[1], `[data-order-cell="1-${task.col}"]`), target("second-a"), target("second-b"), `${taskIndex}-second`, [ordersValues[task.row][1], RECIPE[1][task.col]], ["fly-row", "fly-col"]);
    else if (phase === 4) next = pair(target("first-result"), target("second-result"), target("sum-first"), target("sum-second"), `${taskIndex}-sum`, [first, second], ["fly-prod", "fly-prod"]);
    else {
      const start = center(target("total"));
      const end = center(root.querySelector(`[data-result-cell="${task.row}-${task.col}"]`));
      if (start && end) next = [{ id: `${taskIndex}-total`, value: total, tone: "fly-total", startX: start.x, startY: start.y, endX: end.x, endY: end.y }];
    }
    setFlyers(next);
  }, [phase, taskIndex]);

  const resultValues = ORDER_PEOPLE.map((_, row) => SUPPLIES.map((_, col) => {
    const resultIndex = tasks.findIndex((item) => item.row === row && item.col === col);
    if (resultIndex < taskIndex || (resultIndex === taskIndex && phase >= 7)) {
      return ordersValues[row][0] * RECIPE[0][col] + ordersValues[row][1] * RECIPE[1][col];
    }
    return "";
  }));

  return (
    <div className="interaction-card matrix-lab cafe-row-column-stage cafe-revision-stage" ref={rootRef}>
      <div className="lab-columns cafe-source-matrices">
        <div className="cafe-matrix-panel">
          <MatrixTable rows={ORDER_PEOPLE} cols={DRINKS} values={ordersValues} language={language} highlightRow={task.row} activeCell={sourceRowCell} hideLabels />
        </div>
        <div className="cafe-matrix-panel">
          <MatrixTable rows={DRINKS} cols={SUPPLIES} values={RECIPE} language={language} highlightCol={task.col} activeCell={sourceRecipeCell} hideLabels />
        </div>
      </div>
      <div className="calculation-strip revision-calculation" aria-live="polite">
        <span className="math-expr" dir="ltr">
          <span className="mag-num mag-row" data-revision-slot="first-a" data-land={phase >= 1 ? "true" : undefined}>{phase >= 1 ? ordersValues[task.row][0] : ""}</span>
          <span className="mag-op">×</span>
          <span className="mag-num mag-col" data-revision-slot="first-b" data-land={phase >= 1 ? "true" : undefined}>{phase >= 1 ? RECIPE[0][task.col] : ""}</span>
          <span className="mag-op">=</span>
          <span className="mag-num mag-prod" data-revision-slot="first-result" data-land={phase >= 1 ? "true" : undefined}>{phase >= 1 ? first : ""}</span>
        </span>
        <span className="math-expr" dir="ltr">
          <span className="mag-num mag-row" data-revision-slot="second-a" data-land={phase >= 3 ? "true" : undefined}>{phase >= 3 ? ordersValues[task.row][1] : ""}</span>
          <span className="mag-op">×</span>
          <span className="mag-num mag-col" data-revision-slot="second-b" data-land={phase >= 3 ? "true" : undefined}>{phase >= 3 ? RECIPE[1][task.col] : ""}</span>
          <span className="mag-op">=</span>
          <span className="mag-num mag-prod" data-revision-slot="second-result" data-land={phase >= 3 ? "true" : undefined}>{phase >= 3 ? second : ""}</span>
        </span>
        <strong className="math-expr" dir="ltr">
          <span className="mag-num mag-prod" data-revision-slot="sum-first" data-land={phase >= 5 ? "true" : undefined}>{phase >= 5 ? first : ""}</span>
          <span className="mag-op">+</span>
          <span className="mag-num mag-prod" data-revision-slot="sum-second" data-land={phase >= 5 ? "true" : undefined}>{phase >= 5 ? second : ""}</span>
          <span className="mag-op">=</span>
          <span className="mag-num mag-total" data-revision-slot="total" data-land={phase >= 5 ? "true" : undefined}>{phase >= 5 ? total : ""}</span>
        </strong>
      </div>
      <div className="result-matrix-panel">
        <MatrixTable rows={ORDER_PEOPLE} cols={SUPPLIES} values={resultValues} language={language} activeCell={phase >= 7 ? `${task.row}-${task.col}` : undefined} resultTable hideLabels />
      </div>
      {flyers.map((flyer) => <span key={flyer.id} className={`mag-fly ${flyer.tone}`} onAnimationEnd={() => setFlyers((current) => current.filter((item) => item.id !== flyer.id))} style={{ "--start-x": `${flyer.startX}px`, "--start-y": `${flyer.startY}px`, "--end-x": `${flyer.endX}px`, "--end-y": `${flyer.endY}px`, animationDuration: `${phase === 6 ? timing.result : timing.fly}ms` } as CSSProperties}>{flyer.value}</span>)}
    </div>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function IconPrev() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
      <path d="M6 5h2v14H6zM20 5v14l-10-7z" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
      <path d="M16 5h2v14h-2zM4 5v14l10-7z" />
    </svg>
  );
}

function IconRepeat() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
      <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  );
}

function LearningMatrix({ labelText, rows, cols, values, showSize = true, highlightDimension }: { labelText: string; rows: number; cols: number; values?: number[]; showSize?: boolean; highlightDimension?: "rows" | "cols" }) {
  const cells = values ?? Array.from({ length: rows * cols }, () => "");
  return (
    <div className="learning-matrix-block">
      <strong>{labelText}</strong>
      <div className="learning-matrix" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} aria-label={`${rows} × ${cols}`}>
        {cells.map((value, index) => <span key={index}>{value}</span>)}
      </div>
      {showSize ? <small className="learning-matrix-size" dir="ltr"><span data-highlight={highlightDimension === "rows"}>{rows}</span><span aria-hidden="true"> × </span><span data-highlight={highlightDimension === "cols"}>{cols}</span></small> : null}
    </div>
  );
}

function DimensionIntro({ language, arabicVariant }: InteractionComponentProps) {
  return (
    <div className="interaction-card matrix-lab learning-step">
      <div className="learning-step-heading">
        <strong>{t({ ar: "خلّنا نقرأ أبعاد مصفوفة", ar_fusha: "لنتعرّف إلى أبعاد مصفوفة", en: "Let’s read a matrix’s dimensions" }, language, arabicVariant)}</strong>
        <span>{t({ ar: "الأبعاد تخبرنا بعدد الصفوف والأعمدة.", ar_fusha: "الأبعاد تخبرنا بعدد الصفوف والأعمدة.", en: "Dimensions tell us the number of rows and columns." }, language, arabicVariant)}</span>
      </div>
      <div className="learning-visual-card">
        <LearningMatrix labelText="A" rows={2} cols={3} values={[1, 2, 3, 4, 5, 6]} />
        <div className="learning-explanation">
          <strong dir="ltr">2 × 3</strong>
          <span>{t({ ar: "صفّان وثلاثة أعمدة", ar_fusha: "صفّان وثلاثة أعمدة", en: "2 rows and 3 columns" }, language, arabicVariant)}</span>
        </div>
      </div>
      <div className="meaning-box">
        {t({ ar: "نعدّ الصفوف أولًا، ثم الأعمدة. لذلك أبعاد المصفوفة A هي", ar_fusha: "نعدّ الصفوف أولًا، ثم الأعمدة. لذلك أبعاد المصفوفة A هي", en: "Count rows first, then columns. Matrix A is" }, language, arabicVariant)}{" "}<b className="inline-dimension" dir="ltr">2 × 3</b>.
      </div>
    </div>
  );
}

function DimensionCheck({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const answer = typeof savedState.answer === "string" ? savedState.answer : "";
  const options = ["2 × 3", "3 × 2", "3 × 3"];
  function choose(value: string) {
    const correct = value === "3 × 2";
    const state = { answer: value, correct, completed: correct };
    onStateChange(state);
    if (correct) onComplete(state);
  }
  return (
    <div className="interaction-card matrix-lab learning-step">
      <div className="learning-visual-card single-matrix-card">
        <LearningMatrix labelText="B" rows={3} cols={2} values={[1, 2, 3, 4, 5, 6]} showSize={false} />
      </div>
      <div className="learning-answer-grid" role="group" aria-label={t({ ar: "اختيارات الأبعاد", ar_fusha: "خيارات الأبعاد", en: "Dimension choices" }, language, arabicVariant)}>
        {options.map((option) => {
          const selected = answer === option;
          const correct = selected && option === "3 × 2";
          return <button className="learning-answer dimension-answer" dir="ltr" data-selected={selected} data-correct={correct} aria-pressed={selected} key={option} type="button" onClick={() => choose(option)}>{option}</button>;
        })}
      </div>
      <div className="learning-hint">{t({ ar: "تلميح: الأبعاد = عدد الصفوف × عدد الأعمدة.", ar_fusha: "تلميح: الأبعاد = عدد الصفوف × عدد الأعمدة.", en: "Hint: dimensions = rows × columns." }, language, arabicVariant)}</div>
      {answer ? <div className="learning-feedback" data-correct={answer === "3 × 2"}>{answer === "3 × 2" ? t({ ar: "صح! فيها 3 صفوف وعمودين.", ar_fusha: "صحيح! فيها 3 صفوف وعمودان.", en: "Correct! It has 3 rows and 2 columns." }, language, arabicVariant) : t({ ar: "قريب. ارجع للمصفوفة وعدّ الصفوف ثم الأعمدة.", ar_fusha: "ليست الإجابة الصحيحة. عدّ الصفوف ثم الأعمدة مرة أخرى.", en: "Not quite. Count the rows, then the columns again." }, language, arabicVariant)}</div> : null}
    </div>
  );
}

function MultiplicationRule({ language, arabicVariant }: InteractionComponentProps) {
  return (
    <div className="interaction-card matrix-lab learning-step">
      <div className="rule-example-list">
        <div className="rule-example" data-valid="false">
          <LearningMatrix labelText="A" rows={2} cols={3} highlightDimension="cols" />
          <span className="rule-symbol" aria-hidden="true">×</span>
          <LearningMatrix labelText="B" rows={2} cols={2} highlightDimension="rows" />
          <div className="rule-verdict"><strong dir="ltr">3 ≠ 2</strong><span>{t({ ar: "ما ينفع", ar_fusha: "لا يمكن الضرب", en: "Cannot multiply" }, language, arabicVariant)}</span></div>
        </div>
        <div className="rule-example" data-valid="true">
          <LearningMatrix labelText="A" rows={2} cols={3} highlightDimension="cols" />
          <span className="rule-symbol" aria-hidden="true">×</span>
          <LearningMatrix labelText="B" rows={3} cols={2} highlightDimension="rows" />
          <div className="rule-verdict"><strong dir="ltr">3 = 3</strong><span>{t({ ar: "ينفع", ar_fusha: "يمكن الضرب", en: "Can multiply" }, language, arabicVariant)}</span></div>
        </div>
      </div>
      <div className="meaning-box">{t({ ar: "الرقمان الملوّنان هما البعدان الداخليان: أعمدة A وصفوف B.", ar_fusha: "الرقمان الملوّنان هما البعدان الداخليان: أعمدة A وصفوف B.", en: "The highlighted numbers are the inner dimensions: A’s columns and B’s rows." }, language, arabicVariant)}</div>
    </div>
  );
}

function MultiplicationCheck({ language, arabicVariant, stage, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const secondQuestion = stage === "multiplication-check-two";
  const left = { rows: 2, cols: 3 };
  const right = secondQuestion ? { rows: 2, cols: 2 } : { rows: 3, cols: 2 };
  const canMultiply = left.cols === right.rows;
  const answer = typeof savedState.answer === "string" ? savedState.answer : "";
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
  }, []);

  function choose(value: "yes" | "no") {
    const correct = (value === "yes") === canMultiply;
    const state = { answer: value, correct, completed: correct };
    setShowHint(true);
    if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => setShowHint(false), 2000);
    onStateChange(state);
    if (correct) onComplete(state);
  }
  return (
    <div className="interaction-card matrix-lab learning-step">
      <div className="learning-visual-card multiplication-question-card" data-show-hint={showHint}>
        <LearningMatrix labelText="A" rows={left.rows} cols={left.cols} highlightDimension={showHint ? "cols" : undefined} />
        <span className="rule-symbol" aria-hidden="true">×</span>
        <LearningMatrix labelText="B" rows={right.rows} cols={right.cols} highlightDimension={showHint ? "rows" : undefined} />
      </div>
      <div className="multiplication-answer-grid">
        <button className="learning-answer" data-selected={answer === "yes"} data-correct={answer === "yes" && canMultiply} aria-pressed={answer === "yes"} type="button" onClick={() => choose("yes")}>{t({ ar: "إيه، ينفع", ar_fusha: "نعم، يمكن", en: "Yes" }, language, arabicVariant)}</button>
        <button className="learning-answer" data-selected={answer === "no"} data-correct={answer === "no" && !canMultiply} aria-pressed={answer === "no"} type="button" onClick={() => choose("no")}>{t({ ar: "لا، ما ينفع", ar_fusha: "لا، لا يمكن", en: "No" }, language, arabicVariant)}</button>
      </div>
      {answer ? <div className="learning-feedback" data-correct={((answer === "yes") === canMultiply)}>{((answer === "yes") === canMultiply) ? (canMultiply ? t({ ar: "صح. 3 أعمدة تساوي 3 صفوف.", ar_fusha: "صحيح. ثلاثة أعمدة تساوي ثلاثة صفوف.", en: "Correct. 3 columns match 3 rows." }, language, arabicVariant) : t({ ar: "صح. 3 أعمدة ما تساوي صفّين.", ar_fusha: "صحيح. ثلاثة أعمدة لا تساوي صفّين.", en: "Correct. 3 columns do not match 2 rows." }, language, arabicVariant)) : t({ ar: "لسه لا. قارن الرقمين اللي في الوسط.", ar_fusha: "ليست الإجابة الصحيحة. قارن البعدين الداخليين.", en: "Not quite. Compare the inner dimensions." }, language, arabicVariant)}</div> : null}
    </div>
  );
}
