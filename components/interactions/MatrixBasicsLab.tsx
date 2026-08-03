"use client";

import { type PointerEvent, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { numberValue, type InteractionComponentProps, type InteractionState } from "./types";

const SCENES = [
  { id: "cinema", icon: { ar: "\u0633\u064a\u0646\u0645\u0627", ar_fusha: "\u0633\u064a\u0646\u0645\u0627", en: "Cinema" }, rows: { ar: "\u0635\u0641\u0648\u0641 \u0627\u0644\u0633\u064a\u0646\u0645\u0627", ar_fusha: "\u0635\u0641\u0648\u0641 \u0627\u0644\u0633\u064a\u0646\u0645\u0627", en: "cinema rows" }, cols: { ar: "\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0645\u0642\u0627\u0639\u062f", ar_fusha: "\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0645\u0642\u0627\u0639\u062f", en: "seat numbers" } },
  { id: "weather", icon: { ar: "\u0627\u0644\u0623\u064a\u0627\u0645", ar_fusha: "\u0627\u0644\u0623\u064a\u0627\u0645", en: "Days" }, rows: { ar: "\u0627\u0644\u0623\u064a\u0627\u0645", ar_fusha: "\u0627\u0644\u0623\u064a\u0627\u0645", en: "days" }, cols: { ar: "\u062f\u0631\u062c\u0629 \u0627\u0644\u062d\u0631\u0627\u0631\u0629", ar_fusha: "\u062f\u0631\u062c\u0629 \u0627\u0644\u062d\u0631\u0627\u0631\u0629", en: "temperature" } },
  { id: "shelves", icon: { ar: "\u0631\u0641 \u0627\u0644\u0628\u0647\u0627\u0631\u0627\u062a", ar_fusha: "\u0631\u0641 \u0627\u0644\u0628\u0647\u0627\u0631\u0627\u062a", en: "Spice shelf" }, rows: { ar: "\u0645\u0633\u062a\u0648\u064a\u0627\u062a \u0627\u0644\u0631\u0641", ar_fusha: "\u0645\u0633\u062a\u0648\u064a\u0627\u062a \u0627\u0644\u0631\u0641", en: "shelf levels" }, cols: { ar: "\u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0628\u0647\u0627\u0631\u0627\u062a", ar_fusha: "\u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0628\u0647\u0627\u0631\u0627\u062a", en: "spice types" } },
  { id: "pixels", icon: { ar: "\u0635\u0648\u0631\u0629", ar_fusha: "\u0635\u0648\u0631\u0629", en: "Image" }, rows: { ar: "\u0628\u0643\u0633\u0644\u0627\u062a \u0639\u0645\u0648\u062f\u064a\u0629", ar_fusha: "\u0628\u0643\u0633\u0644\u0627\u062a \u0639\u0645\u0648\u062f\u064a\u0629", en: "vertical pixels" }, cols: { ar: "\u0628\u0643\u0633\u0644\u0627\u062a \u0623\u0641\u0642\u064a\u0629", ar_fusha: "\u0628\u0643\u0633\u0644\u0627\u062a \u0623\u0641\u0642\u064a\u0629", en: "horizontal pixels" } }
];
const SEAT_ROWS = ["A", "B", "C"];
const SEAT_COLS = ["1", "2", "3", "4"];

export function MatrixBasicsLab(props: InteractionComponentProps) {
  if (props.stage === "build-cinema") return <CinemaBuild {...props} />;
  if (props.stage === "cell-scanner") return <CellScanner {...props} />;
  if (props.stage === "cell-recap") return <MatrixCellRecap {...props} />;
  if (props.stage === "examples-carousel") return <ExamplesCarousel {...props} />;
  return <SceneMatcher {...props} />;
}

type MatchPoint = { x: number; y: number };

function SceneMatcher({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pointer, setPointer] = useState<MatchPoint | null>(null);
  const matches = (savedState.matches && typeof savedState.matches === "object" ? savedState.matches : {}) as Record<string, string>;
  const selected = typeof savedState.selected === "string" ? savedState.selected : "";
  const done = SCENES.every((scene) => matches[scene.id] === scene.id);

  function commit(next: InteractionState) {
    const merged = { ...savedState, ...next };
    const nextMatches = (merged.matches && typeof merged.matches === "object" ? merged.matches : {}) as Record<string, string>;
    const completed = SCENES.every((scene) => nextMatches[scene.id] === scene.id);
    const state = { ...merged, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }

  function pointFor(element: HTMLElement | null): MatchPoint | null {
    const board = boardRef.current;
    if (!board || !element) return null;
    const boardBox = board.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    return { x: box.left + box.width / 2 - boardBox.left, y: box.top + box.height / 2 - boardBox.top };
  }

  function pointerFor(event: PointerEvent): MatchPoint | null {
    const board = boardRef.current;
    if (!board) return null;
    const box = board.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(box.width, event.clientX - box.left)),
      y: Math.max(0, Math.min(box.height, event.clientY - box.top))
    };
  }

  function selectScene(sceneId: string) {
    commit({ selected: sceneId });
    setPointer(pointFor(leftRefs.current[sceneId]));
  }

  function tryMatch(sceneId: string, event: PointerEvent) {
    if (!selected) return;
    if (selected === sceneId) {
      commit({ selected: "", matches: { ...matches, [selected]: sceneId } });
      setPointer(null);
      return;
    }
    setPointer(pointerFor(event));
  }

  const matchedLines = SCENES.map((scene) => {
    if (matches[scene.id] !== scene.id) return null;
    const from = pointFor(leftRefs.current[scene.id]);
    const to = pointFor(rightRefs.current[scene.id]);
    return from && to ? { id: scene.id, from, to } : null;
  }).filter(Boolean) as Array<{ id: string; from: MatchPoint; to: MatchPoint }>;
  const activeFrom = selected ? pointFor(leftRefs.current[selected]) : null;

  return (
    <div className="interaction-card matrix-lab">
      <div
        className="scene-match-board"
        ref={boardRef}
        onPointerMove={(event) => {
          if (selected) setPointer(pointerFor(event));
        }}
      >
        <svg className="scene-match-lines" aria-hidden="true">
          {matchedLines.map((line) => (
            <line className="scene-match-line attached" key={line.id} x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} />
          ))}
          {activeFrom && pointer ? <line className="scene-match-line active" x1={activeFrom.x} y1={activeFrom.y} x2={pointer.x} y2={pointer.y} /> : null}
        </svg>
        <div className="lab-columns scene-match-columns">
          <div className="mini-card-list">
            {SCENES.map((scene) => {
              const matched = matches[scene.id] === scene.id;
              return (
                <button className="matrix-card" data-matched={matched} aria-pressed={selected === scene.id} ref={(node) => { leftRefs.current[scene.id] = node; }} key={scene.id} type="button" onClick={() => selectScene(scene.id)}>
                  <strong>{t(scene.icon, language, arabicVariant)}</strong>
                </button>
              );
            })}
          </div>
          <div className="mini-card-list">
            {SCENES.map((scene) => (
              <button className="matrix-card" data-matched={matches[scene.id] === scene.id} ref={(node) => { rightRefs.current[scene.id] = node; }} key={scene.id} type="button" onPointerDown={(event) => tryMatch(scene.id, event)}>
                <span>{t(scene.rows, language, arabicVariant)}</span>
                <span>+</span>
                <span>{t(scene.cols, language, arabicVariant)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="meaning-box" aria-live="polite">
        {done
          ? t({ ar: "\u0635\u062d. \u0643\u0644\u0647\u0627 \u062a\u0646\u062a\u0631\u062a\u0628 \u0628\u0635\u0641\u0648\u0641 \u0648\u0623\u0639\u0645\u062f\u0629.", ar_fusha: "\u0635\u062d\u064a\u062d. \u0643\u0644\u0647\u0627 \u062a\u0646\u062a\u0638\u0645 \u0628\u0635\u0641\u0648\u0641 \u0648\u0623\u0639\u0645\u062f\u0629.", en: "Correct. Each one is organized with rows and columns." }, language, arabicVariant)
          : t({ ar: "\u0627\u062e\u062a\u0631 \u0645\u062b\u0627\u0644\u060c \u062b\u0645 \u0648\u0635\u0644\u0647 \u0628\u0627\u0644\u0648\u0635\u0641 \u0627\u0644\u0635\u062d\u064a\u062d.", ar_fusha: "\u0627\u062e\u062a\u0631 \u0645\u062b\u0627\u0644\u0627\u060c \u062b\u0645 \u0635\u0644\u0647 \u0628\u0627\u0644\u0648\u0635\u0641 \u0627\u0644\u0635\u062d\u064a\u062d.", en: "Choose an example, then connect it to the right description." }, language, arabicVariant)}
      </div>
      <button className="button" type="button" onClick={() => { setPointer(null); onStateChange({ matches: {}, selected: "", completed: false }); }}>
        {t({ ar: "\u0625\u0639\u0627\u062f\u0629", ar_fusha: "\u0625\u0639\u0627\u062f\u0629", en: "Reset" }, language, arabicVariant)}
      </button>
    </div>
  );
}
const ARABIC_SEAT_ROWS = ["\u0623", "\u0628", "\u062c"];

function CinemaBuild({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const occupied = Array.isArray(savedState.occupied) ? (savedState.occupied as string[]) : [];
  const numeric = savedState.numeric === true;
  const complete = numeric && occupied.length >= 3;
  const rowLabels = language === "en" ? SEAT_ROWS : ARABIC_SEAT_ROWS;

  function commit(next: InteractionState) {
    const merged = { ...savedState, ...next };
    const nextOccupied = Array.isArray(merged.occupied) ? (merged.occupied as string[]) : [];
    const completed = merged.numeric === true && nextOccupied.length >= 3;
    const state = { ...merged, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }

  return (
    <div className="interaction-card matrix-lab cinema-seat-map">
      <div className="matrix-grid labelled-grid" style={{ gridTemplateColumns: `repeat(${SEAT_COLS.length + 1}, minmax(44px, 1fr))` }}>
        <span />
        {SEAT_COLS.map((col) => <strong key={col}>{col}</strong>)}
        {SEAT_ROWS.flatMap((row, rowIndex) => [
          <strong key={row}>{rowLabels[rowIndex]}</strong>,
          ...SEAT_COLS.map((col) => {
            const id = `${row}${col}`;
            const isOccupied = occupied.includes(id);
            return (
              <button className="seat-cell cinema-seat-cell" data-seat-state={isOccupied ? "taken" : "open"} data-seat-view={numeric ? "numeric" : "label"} aria-pressed={isOccupied} key={id} type="button" onClick={() => commit({ occupied: isOccupied ? occupied.filter((item) => item !== id) : [...occupied, id] })}>
                {numeric ? (isOccupied ? "1" : "0") : isOccupied ? t({ ar: "\u0645\u0634\u063a\u0648\u0644", ar_fusha: "\u0645\u0634\u063a\u0648\u0644", en: "Taken" }, language, arabicVariant) : t({ ar: "\u0641\u0627\u0636\u064a", ar_fusha: "\u0641\u0627\u0631\u063a", en: "Open" }, language, arabicVariant)}
              </button>
            );
          })
        ])}
      </div>
      <div className="button-row">
        <button className="button primary" type="button" onClick={() => commit({ numeric: !numeric })}>
          {numeric ? t({ ar: "\u0639\u0631\u0636 \u0627\u0644\u0645\u0642\u0627\u0639\u062f", ar_fusha: "\u0639\u0631\u0636 \u0627\u0644\u0645\u0642\u0627\u0639\u062f", en: "Seat view" }, language, arabicVariant) : t({ ar: "\u062d\u0648\u0651\u0644\u0647\u0627 \u0625\u0644\u0649 1 \u06480", ar_fusha: "\u062d\u0648\u0651\u0644\u0647\u0627 \u0625\u0644\u0649 1 \u06480", en: "Show 1s and 0s" }, language, arabicVariant)}
        </button>
        <button className="button" type="button" onClick={() => onStateChange({ occupied: [], numeric: false, completed: false })}>{t({ ar: "\u0625\u0639\u0627\u062f\u0629", ar_fusha: "\u0625\u0639\u0627\u062f\u0629", en: "Reset" }, language, arabicVariant)}</button>
      </div>
      <div className="meaning-box" aria-live="polite">
        {complete
          ? t({ ar: "\u0645\u0645\u062a\u0627\u0632. \u0627\u0644\u0623\u062d\u0645\u0631 \u064a\u0639\u0646\u064a \u0645\u0634\u063a\u0648\u0644 = 1\u060c \u0648\u0627\u0644\u0623\u062e\u0636\u0631 \u064a\u0639\u0646\u064a \u0641\u0627\u0636\u064a = 0.", ar_fusha: "\u0645\u0645\u062a\u0627\u0632. \u0627\u0644\u0623\u062d\u0645\u0631 \u064a\u0639\u0646\u064a \u0645\u0634\u063a\u0648\u0644 = 1\u060c \u0648\u0627\u0644\u0623\u062e\u0636\u0631 \u064a\u0639\u0646\u064a \u0641\u0627\u0631\u063a = 0.", en: "Nice. Red means taken = 1, and green means open = 0." }, language, arabicVariant)
          : t({ ar: "\u0627\u062e\u062a\u0631 3 \u0645\u0642\u0627\u0639\u062f \u0645\u0634\u063a\u0648\u0644\u0629. \u0628\u0639\u062f\u0647\u0627 \u062d\u0648\u0651\u0644 \u0627\u0644\u062e\u0631\u064a\u0637\u0629 \u0625\u0644\u0649 1 \u06480.", ar_fusha: "\u0627\u062e\u062a\u0631 3 \u0645\u0642\u0627\u0639\u062f \u0645\u0634\u063a\u0648\u0644\u0629. \u0628\u0639\u062f\u0647\u0627 \u062d\u0648\u0651\u0644 \u0627\u0644\u062e\u0631\u064a\u0637\u0629 \u0625\u0644\u0649 1 \u06480.", en: "Choose 3 taken seats. Then turn the map into 1s and 0s." }, language, arabicVariant)}
      </div>
    </div>
  );
}

function CellScanner({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const values = [
    [0, 1, 0, 1],
    [1, 0, 1, 0],
    [0, 0, 1, 1]
  ];
  const rowLabels = language === "en" ? SEAT_ROWS : ["\u0623", "\u0628", "\u062c"];
  const selected = typeof savedState.cell === "string" ? savedState.cell : "";

  function choose(row: number, col: number) {
    const id = `${rowLabels[row]}${SEAT_COLS[col]}`;
    const state = { ...savedState, cell: id, row: rowLabels[row], col: SEAT_COLS[col], value: values[row][col], completed: true };
    onStateChange(state);
    onComplete(state);
  }

  return (
    <div className="interaction-card matrix-lab">
      <div className="matrix-grid labelled-grid" style={{ gridTemplateColumns: `repeat(${SEAT_COLS.length + 1}, minmax(44px, 1fr))` }}>
        <span />
        {SEAT_COLS.map((col) => <strong key={col}>{col}</strong>)}
        {rowLabels.flatMap((row, rowIndex) => [
          <strong key={row}>{row}</strong>,
          ...SEAT_COLS.map((col, colIndex) => {
            const id = `${row}${col}`;
            const value = values[rowIndex][colIndex];
            const isSelected = selected === id;
            return <button className="seat-cell" data-selected={isSelected} data-selected-value={isSelected ? value : undefined} aria-pressed={isSelected} key={id} type="button" onClick={() => choose(rowIndex, colIndex)}>{value}</button>;
          })
        ])}
      </div>
      <div className="meaning-box" aria-live="polite">
        {selected
          ? t({ ar: `\u0627\u0644\u062e\u0644\u064a\u0629 ${selected}: \u0635\u0641 ${savedState.row}\u060c \u0639\u0645\u0648\u062f ${savedState.col}\u060c \u0648\u0642\u064a\u0645\u062a\u0647\u0627 ${savedState.value}. \u064a\u0639\u0646\u064a \u0645\u0642\u0639\u062f ${savedState.value === 1 ? "\u0645\u0634\u063a\u0648\u0644" : "\u0641\u0627\u0636\u064a"}.`, ar_fusha: `\u0627\u0644\u062e\u0644\u064a\u0629 ${selected}: \u0635\u0641 ${savedState.row}\u060c \u0639\u0645\u0648\u062f ${savedState.col}\u060c \u0648\u0642\u064a\u0645\u062a\u0647\u0627 ${savedState.value}. \u0647\u0630\u0627 \u064a\u0639\u0646\u064a \u0645\u0642\u0639\u062f\u064b\u0627 ${savedState.value === 1 ? "\u0645\u0634\u063a\u0648\u0644\u064b\u0627" : "\u0641\u0627\u0631\u063a\u064b\u0627"}.`, en: `Cell ${selected}: row ${savedState.row}, column ${savedState.col}, value ${savedState.value}. That means the seat is ${savedState.value === 1 ? "occupied" : "available"}.` }, language, arabicVariant)
          : t({ ar: "\u0627\u0636\u063a\u0637 \u0623\u064a \u0631\u0642\u0645. \u0628\u0639\u062f\u0647\u0627 \u0634\u0648\u0641 \u0627\u0644\u0635\u0641\u060c \u0627\u0644\u0639\u0645\u0648\u062f\u060c \u0648\u0645\u0639\u0646\u0649 \u0627\u0644\u0642\u064a\u0645\u0629.", ar_fusha: "\u0627\u0636\u063a\u0637 \u0623\u064a \u0639\u062f\u062f. \u0628\u0639\u062f\u0647\u0627 \u0634\u0627\u0647\u062f \u0627\u0644\u0635\u0641\u060c \u0627\u0644\u0639\u0645\u0648\u062f\u060c \u0648\u0645\u0639\u0646\u0649 \u0627\u0644\u0642\u064a\u0645\u0629.", en: "Tap any number. Then read its row, column, and value meaning." }, language, arabicVariant)}
      </div>
      <button className="button" type="button" onClick={() => onStateChange({ cell: "", row: "", col: "", value: undefined, completed: false })}>{t({ ar: "\u0625\u0639\u0627\u062f\u0629", ar_fusha: "\u0625\u0639\u0627\u062f\u0629", en: "Reset" }, language, arabicVariant)}</button>
    </div>
  );
}
function MatrixCellRecap({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const values = [[1, 2, 3], [4, 5, 6]];
  const initialRow = Math.max(0, Math.min(1, numberValue(savedState.rowIndex, 1)));
  const initialCol = Math.max(0, Math.min(2, numberValue(savedState.colIndex, 1)));
  const [active, setActive] = useState({ row: initialRow, col: initialCol });
  const value = values[active.row][active.col];
  const xs = [220, 320, 420];
  const ys = [143, 223];

  function choose(row: number, col: number, commit = false) {
    setActive({ row, col });
    if (!commit) return;
    const state = { rowIndex: row, colIndex: col, value: values[row][col], completed: true };
    onStateChange(state);
    onComplete(state);
  }

  const summary = t({
    ar: `\u0627\u0644\u062e\u0644\u064a\u0629 \u0627\u0644\u0645\u062d\u062f\u062f\u0629: \u0635\u0641 ${active.row + 1}\u060c \u0639\u0645\u0648\u062f ${active.col + 1}\u060c \u0627\u0644\u0642\u064a\u0645\u0629 ${value}.`,
    ar_fusha: `\u0627\u0644\u062e\u0644\u064a\u0629 \u0627\u0644\u0645\u062d\u062f\u062f\u0629: \u0627\u0644\u0635\u0641 ${active.row + 1}\u060c \u0627\u0644\u0639\u0645\u0648\u062f ${active.col + 1}\u060c \u0627\u0644\u0642\u064a\u0645\u0629 ${value}.`,
    en: `Selected cell: row ${active.row + 1}, column ${active.col + 1}, value ${value}.`
  }, language, arabicVariant);

  return (
    <div className="interaction-card matrix-lab matrix-cell-demo">
      <svg className="matrix-cell-svg" viewBox="0 0 640 390" role="img" aria-label={summary}>
        <rect width="640" height="390" fill="#ffffff" />
        <rect className="matrix-cell-column-highlight" x={xs[active.col] - 50} y="98" width="100" height="164" />
        <rect className="matrix-cell-row-highlight" x="170" y={ys[active.row] - 40} width="300" height="80" />
        <rect className="matrix-cell-active-highlight" x={xs[active.col] - 50} y={ys[active.row] - 40} width="100" height="80" />
        <path d="M170 100 H128 V260 H170" fill="none" stroke="#24211b" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M470 100 H512 V260 H470" fill="none" stroke="#24211b" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <g fontFamily="Georgia, 'Times New Roman', serif" fontSize="54" fontWeight="700" fill="#24211b" textAnchor="middle" dominantBaseline="middle">
          {values.flatMap((row, rowIndex) => row.map((cellValue, colIndex) => {
            const selected = active.row === rowIndex && active.col === colIndex;
            return (
              <g className="matrix-cell-hotspot" key={`${rowIndex}-${colIndex}`} role="button" tabIndex={0} aria-label={`row ${rowIndex + 1}, column ${colIndex + 1}, value ${cellValue}`} onPointerEnter={() => choose(rowIndex, colIndex)} onFocus={() => choose(rowIndex, colIndex)} onClick={() => choose(rowIndex, colIndex, true)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") choose(rowIndex, colIndex, true); }}>
                <rect className="matrix-cell-touch" x={xs[colIndex] - 50} y={ys[rowIndex] - 40} width="100" height="80" />
                <text className={selected ? "matrix-cell-number active" : "matrix-cell-number"} x={xs[colIndex]} y={ys[rowIndex]}>{cellValue}</text>
              </g>
            );
          }))}
        </g>
        <g fontFamily="Arial, Tahoma, sans-serif" fontSize="22" fontWeight="800" fill="#5f4632" textAnchor="middle">
          <text x={xs[active.col]} y="74">{t({ ar: `\u0627\u0644\u0639\u0645\u0648\u062f ${active.col + 1}`, ar_fusha: `\u0627\u0644\u0639\u0645\u0648\u062f ${active.col + 1}`, en: `Column ${active.col + 1}` }, language, arabicVariant)}</text>
          <text x="48" y={ys[active.row] + 7} textAnchor="middle">{t({ ar: `\u0627\u0644\u0635\u0641 ${active.row + 1}`, ar_fusha: `\u0627\u0644\u0635\u0641 ${active.row + 1}`, en: `Row ${active.row + 1}` }, language, arabicVariant)}</text>
          <text x="320" y="332">{t({ ar: `\u0627\u0644\u0642\u064a\u0645\u0629 = ${value}`, ar_fusha: `\u0627\u0644\u0642\u064a\u0645\u0629 = ${value}`, en: `Value = ${value}` }, language, arabicVariant)}</text>
        </g>
      </svg>
      <div className="meaning-box" aria-live="polite">{summary}</div>
    </div>
  );
}
function ExamplesCarousel({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const examples = [
    { ar: "سينما", ar_fusha: "سينما", en: "Cinema" },
    { ar: "طقس", ar_fusha: "طقس", en: "Weather" },
    { ar: "مخزون", ar_fusha: "مخزون", en: "Inventory" },
    { ar: "أسهم", ar_fusha: "أسهم", en: "Stocks" },
    { ar: "فلتر صورة", ar_fusha: "مرشح صورة", en: "Image filter" },
    { ar: "نص", ar_fusha: "نص", en: "Text" }
  ];
  const index = typeof savedState.index === "number" ? savedState.index : 0;
  const viewed = new Set(Array.isArray(savedState.viewed) ? (savedState.viewed as number[]) : [index]);

  function setIndex(nextIndex: number) {
    viewed.add(nextIndex);
    const completed = viewed.size >= 4;
    const state = { index: nextIndex, viewed: Array.from(viewed), completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }

  return (
    <div className="interaction-card matrix-lab">
      <div className="matrix-example-stage">
        <strong>{t(examples[index], language, arabicVariant)}</strong>
        <div className="matrix-grid compact" dir="ltr">
          {[1, 0, 2, 0, 3, 1, 4, 1, 0].map((value, cell) => <span className="seat-cell static" key={`${index}-${cell}`}>{(value + index) % 5}</span>)}
        </div>
      </div>
      <div className="button-row">
        <button className="button" type="button" onClick={() => setIndex((index + examples.length - 1) % examples.length)}>{t({ ar: "السابق", ar_fusha: "السابق", en: "Previous" }, language, arabicVariant)}</button>
        <button className="button primary" type="button" onClick={() => setIndex((index + 1) % examples.length)}>{t({ ar: "التالي", ar_fusha: "التالي", en: "Next" }, language, arabicVariant)}</button>
        <button className="button" type="button" onClick={() => onStateChange({ index: 0, viewed: [0], completed: false })}>{t({ ar: "إعادة", ar_fusha: "إعادة", en: "Reset" }, language, arabicVariant)}</button>
      </div>
      <div className="meaning-box" aria-live="polite">
        {viewed.size >= 4
          ? t({ ar: "المصفوفات تظهر في أماكن كثيرة: صور، نصوص، مخزون، وقياسات.", ar_fusha: "تظهر المصفوفات في أماكن كثيرة: صور، نصوص، مخزون، وقياسات.", en: "Matrices show up in many places: images, text, inventory, and measurements." }, language, arabicVariant)
          : t({ ar: "تنقّل بين أربعة أمثلة على الأقل.", ar_fusha: "تنقّل بين أربعة أمثلة على الأقل.", en: "Move through at least four examples." }, language, arabicVariant)}
      </div>
    </div>
  );
}
