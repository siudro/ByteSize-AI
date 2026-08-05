"use client";

import { useRef, useState, type CSSProperties } from "react";
import { t } from "@/lib/i18n";
import type { InteractionComponentProps, InteractionState } from "./types";

const PEOPLE = ["Sara", "Fahad", "Noura"];
const DRINKS = ["Saudi coffee", "Karak"];
const SUPPLIES = ["Cups", "Water", "Milk"];
const RECIPE = [[1, 1, 0], [1, 1, 1]];
const DEFAULT_ORDERS = [[2, 1], [1, 0], [0, 2]];
const ORDER_PEOPLE = PEOPLE.slice(0, 2);
const ORDER_DEFAULTS = [[0, 0], [0, 0]];
const DEMO_ORDERS = [[2, 1], [1, 0]];

function label(name: string, language: string) {
  const ar: Record<string, string> = { Sara: "سارة", Fahad: "فهد", Noura: "نورة", "Saudi coffee": "قهوة سعودية", Karak: "كرك", Cups: "أكواب", Water: "ماء", Milk: "حليب" };
  return language === "en" ? name : ar[name] ?? name;
}

export function SaudiCafeMatrix(props: InteractionComponentProps) {
  if (props.stage === "recipes") return <RecipeStage {...props} />;
  if (props.stage === "shared-link") return <SharedLinkStage {...props} />;
  if (props.stage === "row-column-demo") return <RowColumnDemo {...props} />;
  if (props.stage === "compatibility-labels") return <CompatibilityLabels {...props} />;
  if (props.stage === "dimensions") return <DimensionsReveal {...props} />;
  return <OrdersStage {...props} />;
}

function MatrixTable({ rows, cols, values, language, highlightRow, highlightCol, activeCell, sharedCols, sharedRows, labelColWidth }: { rows: string[]; cols: string[]; values: number[][]; language: string; highlightRow?: number; highlightCol?: number; activeCell?: string; sharedCols?: number[]; sharedRows?: number[]; labelColWidth?: string }) {
  return (
    <div className="matrix-grid labelled-grid" style={{ gridTemplateColumns: labelColWidth ? `${labelColWidth} repeat(${cols.length}, minmax(48px, 1fr))` : `repeat(${cols.length + 1}, minmax(58px, 1fr))` }}>
      <span />
      {cols.map((col, index) => <strong data-highlight={highlightCol === index} data-shared={sharedCols?.includes(index) ? "true" : undefined} key={col}>{label(col, language)}</strong>)}
      {rows.flatMap((row, rowIndex) => [
        <strong data-highlight={highlightRow === rowIndex} data-shared={sharedRows?.includes(rowIndex) ? "true" : undefined} data-person-row={rowIndex} key={row}>{label(row, language)}</strong>,
        ...cols.map((col, colIndex) => {
          const cellId = `${rowIndex}-${colIndex}`;
          return <span className="seat-cell static" data-active={activeCell === cellId} data-highlight={highlightRow === rowIndex || highlightCol === colIndex} data-order-cell={cellId} data-person-row={rowIndex} key={`${row}-${col}`}>{values[rowIndex][colIndex]}</span>;
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
        <button className="button" aria-pressed={selected === "drinks"} type="button" onClick={() => choose("drinks")}>{t({ ar: "المشروبات", ar_fusha: "المشروبات", en: "Drinks" }, language, arabicVariant)}</button>
        <button className="button" aria-pressed={selected === "people"} type="button" onClick={() => choose("people")}>{t({ ar: "الأشخاص", ar_fusha: "الأشخاص", en: "People" }, language, arabicVariant)}</button>
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
function RowColumnDemo({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const step = typeof savedState.step === "number" ? savedState.step : 0;
  const playing = savedState.playing === true;
  const speed = typeof savedState.speed === "number" ? savedState.speed : 1;
  const milk = typeof savedState.milk === "number" ? savedState.milk : -1;
  const products = [DEFAULT_ORDERS[0][0] * RECIPE[0][0], DEFAULT_ORDERS[0][1] * RECIPE[1][0]];
  const cupsTotal = products[0] + products[1];
  const done = step >= 4 && milk === 1;

  function commit(next: InteractionState) {
    const nextStep = typeof next.step === "number" ? next.step : step;
    const nextMilk = typeof next.milk === "number" ? next.milk : milk;
    const completed = nextStep >= 4 && nextMilk === 1;
    const state = { ...savedState, ...next, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }

  return (
    <div className="interaction-card matrix-lab">
      <div className="lab-columns">
        <MatrixTable rows={PEOPLE} cols={DRINKS} values={DEFAULT_ORDERS} language={language} highlightRow={0} />
        <MatrixTable rows={DRINKS} cols={SUPPLIES} values={RECIPE} language={language} highlightCol={0} />
      </div>
      <div className="calculation-strip" aria-live="polite">
        {step >= 1 ? <span>2 x 1 = {products[0]}</span> : <span>{t({ ar: "ابدأ بالزوج الأول", ar_fusha: "ابدأ بالزوج الأول", en: "Start with the first pair" }, language, arabicVariant)}</span>}
        {step >= 2 ? <span>1 x 1 = {products[1]}</span> : null}
        {step >= 3 ? <strong>{products[0]} + {products[1]} = {cupsTotal}</strong> : null}
        {step >= 4 ? <span>{t({ ar: "نضع الناتج في خلية سارة x الأكواب.", ar_fusha: "نضع الناتج في خلية سارة x الأكواب.", en: "Place the result in Sara x Cups." }, language, arabicVariant)}</span> : null}
      </div>
      <div className="button-row">
        <button className="button" type="button" onClick={() => commit({ playing: !playing, step: Math.min(4, step + 1) })}>{playing ? t({ ar: "إيقاف", ar_fusha: "إيقاف", en: "Pause" }, language, arabicVariant) : t({ ar: "تشغيل", ar_fusha: "تشغيل", en: "Play" }, language, arabicVariant)}</button>
        <button className="button" type="button" onClick={() => commit({ step: Math.max(0, step - 1) })}>{t({ ar: "السابق", ar_fusha: "السابق", en: "Previous" }, language, arabicVariant)}</button>
        <button className="button" type="button" onClick={() => commit({ step: Math.min(4, step + 1) })}>{t({ ar: "التالي", ar_fusha: "التالي", en: "Next" }, language, arabicVariant)}</button>
        <button className="button" type="button" onClick={() => onStateChange({ step: 0, milk: -1, speed: 1, completed: false })}>{t({ ar: "إعادة", ar_fusha: "إعادة", en: "Restart" }, language, arabicVariant)}</button>
        <label className="stepper-row"><span>{t({ ar: "السرعة", ar_fusha: "السرعة", en: "Speed" }, language, arabicVariant)}</span><input min={0.5} max={2} step={0.5} value={speed} type="range" onChange={(e) => commit({ speed: Number(e.target.value) })} /></label>
      </div>
      <div className="meaning-box">
        <strong>{t({ ar: "دورك: الحليب", ar_fusha: "دورك: الحليب", en: "Your turn: milk" }, language, arabicVariant)}</strong>
        <div className="button-row">{[0, 1, 3].map((value) => <button className="button" aria-pressed={milk === value} key={value} type="button" onClick={() => commit({ milk: value })}>{value}</button>)}</div>
        <p>{done ? t({ ar: "صحيح: 2x0 + 1x1 = 1.", ar_fusha: "صحيح: 2x0 + 1x1 = 1.", en: "Correct: 2x0 + 1x1 = 1." }, language, arabicVariant) : t({ ar: "سارة طلبت قهوتين وكرك واحد. كم حصة حليب؟", ar_fusha: "طلبت سارة قهوتين وكركا واحدا. كم حصة حليب؟", en: "Sara ordered two coffees and one karak. How many milk portions?" }, language, arabicVariant)}</p>
      </div>
    </div>
  );
}

function CompatibilityLabels({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const chosen = new Set(Array.isArray(savedState.chosen) ? (savedState.chosen as string[]) : []);
  const pairs = [
    ["People x Drinks", "Drinks x Supplies", true],
    ["Shops x Products", "Products x Prices", true],
    ["People x Drinks", "Machines x Materials", false]
  ] as const;

  function choose(index: number) {
    if (pairs[index][2]) chosen.add(String(index));
    const completed = chosen.size >= 2;
    const state = { chosen: Array.from(chosen), completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }

  return (
    <div className="interaction-card matrix-lab">
      <div className="mini-card-list">
        {pairs.map((pair, index) => (
          <button className="matrix-card" key={pair[0]} type="button" onClick={() => choose(index)}>
            <strong>{pair[0]}</strong><span>{pair[1]}</span>
            <small>{chosen.has(String(index)) ? t({ ar: "يتصل", ar_fusha: "يتصل", en: "Connects" }, language, arabicVariant) : t({ ar: "اختر إذا تركب", ar_fusha: "اختر إذا تتصل", en: "Choose if it connects" }, language, arabicVariant)}</small>
          </button>
        ))}
      </div>
      <div className="meaning-box">{t({ ar: "الفئة الوسطى لازم تتطابق في المعنى.", ar_fusha: "الفئة الوسطى يجب أن تتطابق في المعنى.", en: "The middle category must match in meaning." }, language, arabicVariant)}</div>
    </div>
  );
}

function DimensionsReveal({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const revealed = savedState.revealed === true;
  function reveal() {
    const state = { revealed: true, completed: true };
    onStateChange(state);
    onComplete(state);
  }

  return (
    <div className="interaction-card matrix-lab">
      <div className="dimension-line" dir="ltr"><span>3 x 2</span><span> x </span><span>2 x 3</span><span> = </span><strong>{revealed ? "3 x 3" : "?"}</strong></div>
      <button className="button primary" type="button" onClick={reveal}>{t({ ar: "اكشف الحجم", ar_fusha: "اكشف الحجم", en: "Reveal size" }, language, arabicVariant)}</button>
      <div className="meaning-box">{revealed ? t({ ar: "الرقمان في الوسط متساويان، والناتج يأخذ الرقمين الخارجيين.", ar_fusha: "الرقمان في الوسط متساويان، والناتج يأخذ الرقمين الخارجيين.", en: "The middle sizes match, and the result keeps the outer sizes." }, language, arabicVariant) : t({ ar: "ابدأ بالفئات، ثم اكشف الأبعاد.", ar_fusha: "ابدأ بالفئات، ثم اكشف الأبعاد.", en: "Start with labels, then reveal dimensions." }, language, arabicVariant)}</div>
    </div>
  );
}
