"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { InteractionComponentProps, InteractionState } from "./types";

const TARGET = [
  [0, 0, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 2, 2, 2, 0],
  [0, 1, 1, 1, 2, 2, 2, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 0, 1, 1, 0],
  [0, 0, 1, 1, 0, 1, 1, 0]
];
const MISSING = new Set(["0-2", "1-5", "2-1", "2-4", "2-5", "2-6", "4-1", "5-4", "6-4", "7-5"]);
const COLORS = ["#181818", "#ff3138", "#43aeea"];
const PALETTE_VALUES = [0, 1, 2];

function flatten(grid: number[][]) {
  return grid.flat().join("");
}

function initialGrid() {
  return TARGET.map((row, r) => row.map((value, c) => (MISSING.has(`${r}-${c}`) ? -1 : value)));
}

function readGrid(saved: InteractionState) {
  if (!Array.isArray(saved.grid)) return initialGrid();
  const grid = saved.grid as number[][];
  const valid = grid.length === TARGET.length && grid.every((row, rowIndex) => Array.isArray(row) && row.length === TARGET[rowIndex].length && row.every((value) => Number.isInteger(value) && value >= -1 && value < COLORS.length));
  return valid ? grid : initialGrid();
}

function isComplete(grid: number[][]) {
  return flatten(grid) === flatten(TARGET);
}

function cellTextColor(value: number) {
  if (value === 2) return "#12100d";
  return "#fff8ec";
}

export function GuidedPixelCharacter(props: InteractionComponentProps) {
  if (props.stage === "view-switch") return <ViewSwitch {...props} />;
  if (props.stage === "edits") return <EditMatrix {...props} />;
  return <BuildCharacter {...props} />;
}

function PixelGrid({ grid, mode, onCell }: { grid: number[][]; mode: string; onCell?: (row: number, col: number) => void }) {
  return (
    <div className="pixel-character-grid">
      {grid.flatMap((row, r) => row.map((value, c) => (
        <button
          aria-label={`cell ${r + 1}-${c + 1}`}
          className="pixel-art-cell"
          data-empty={value < 0}
          key={`${r}-${c}`}
          style={{ background: value >= 0 && mode !== "numbers" ? COLORS[value] : undefined, color: value >= 0 && mode !== "numbers" ? cellTextColor(value) : undefined }}
          type="button"
          onClick={() => onCell?.(r, c)}
        >
          {mode !== "character" && value >= 0 ? value : ""}
        </button>
      )))}
    </div>
  );
}

function BuildCharacter({ language, arabicVariant, savedState, onStateChange, onComplete, stage }: InteractionComponentProps) {
  const grid = readGrid(savedState);
  const selected = typeof savedState.palette === "number" ? savedState.palette : 1;
  const history = Array.isArray(savedState.history) ? (savedState.history as number[][][]) : [];
  const complete = isComplete(grid);

  function commit(nextGrid: number[][], next: InteractionState = {}) {
    const completed = isComplete(nextGrid) || stage === "project-build";
    const state = { ...savedState, grid: nextGrid, ...next, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }

  return (
    <div className="interaction-card matrix-lab">
      <div className="pixel-workbench">
        <div><strong>{t({ ar: "\u0627\u0644\u0647\u062f\u0641", ar_fusha: "\u0627\u0644\u0647\u062f\u0641", en: "Target" }, language, arabicVariant)}</strong><PixelGrid grid={TARGET} mode="character" /></div>
        <div>
          <strong>{t({ ar: "\u0634\u0628\u0643\u062a\u0643", ar_fusha: "\u0634\u0628\u0643\u062a\u0643", en: "Your grid" }, language, arabicVariant)}</strong>
          <PixelGrid grid={grid} mode="both" onCell={(row, col) => {
            if (!MISSING.has(`${row}-${col}`)) return;
            const next = grid.map((line) => [...line]);
            next[row][col] = selected;
            commit(next, { history: [...history, grid] });
          }} />
        </div>
      </div>
      <div className="palette-row" role="group" aria-label="palette">
        {PALETTE_VALUES.map((value) => (
          <button className="palette-button" aria-pressed={selected === value} key={value} type="button" onClick={() => onStateChange({ ...savedState, grid, palette: value })}>
            <span className="palette-swatch" style={{ background: COLORS[value] }} />{value}
          </button>
        ))}
      </div>
      <div className="button-row">
        <button className="button" type="button" disabled={history.length === 0} onClick={() => onStateChange({ ...savedState, grid: history[history.length - 1], history: history.slice(0, -1), completed: false })}>{t({ ar: "\u062a\u0631\u0627\u062c\u0639", ar_fusha: "\u062a\u0631\u0627\u062c\u0639", en: "Undo" }, language, arabicVariant)}</button>
        <button className="button" type="button" onClick={() => onStateChange({ grid: initialGrid(), palette: 1, history: [], completed: false })}>{t({ ar: "\u0625\u0639\u0627\u062f\u0629", ar_fusha: "\u0625\u0639\u0627\u062f\u0629", en: "Reset" }, language, arabicVariant)}</button>
        {stage === "project-build" ? <button className="button primary" type="button" onClick={() => onComplete({ ...savedState, grid, completed: true })}>{t({ ar: "\u062e\u0644\u0635\u062a \u0627\u0644\u0623\u0635\u0644", ar_fusha: "\u0623\u0646\u0647\u064a\u062a \u0627\u0644\u0623\u0635\u0644", en: "Original done" }, language, arabicVariant)}</button> : null}
      </div>
      <div className="meaning-box" aria-live="polite">
        {complete ? t({ ar: "\u0635\u062d\u064a\u062d. \u0646\u0641\u0633 \u0627\u0644\u0635\u0648\u0631\u0629 \u062a\u0638\u0647\u0631 \u0643\u0623\u0644\u0648\u0627\u0646 \u0623\u0648 \u0643\u0623\u0631\u0642\u0627\u0645 \u0641\u064a \u0645\u0635\u0641\u0648\u0641\u0629.", ar_fusha: "\u0635\u062d\u064a\u062d. \u0627\u0644\u0635\u0648\u0631\u0629 \u0646\u0641\u0633\u0647\u0627 \u062a\u0638\u0647\u0631 \u0643\u0623\u0644\u0648\u0627\u0646 \u0623\u0648 \u0643\u0623\u0639\u062f\u0627\u062f \u0641\u064a \u0645\u0635\u0641\u0648\u0641\u0629.", en: "Correct. The same image can appear as colors or as numbers in a matrix." }, language, arabicVariant) : t({ ar: "\u0627\u062e\u062a\u0631 \u0642\u064a\u0645\u0629\u060c \u062b\u0645 \u0627\u0636\u063a\u0637 \u0627\u0644\u062e\u0644\u0627\u064a\u0627 \u0627\u0644\u0641\u0627\u0631\u063a\u0629.", ar_fusha: "\u0627\u062e\u062a\u0631 \u0642\u064a\u0645\u0629\u060c \u062b\u0645 \u0627\u0636\u063a\u0637 \u0627\u0644\u062e\u0644\u0627\u064a\u0627 \u0627\u0644\u0641\u0627\u0631\u063a\u0629.", en: "Choose a value, then tap the empty cells." }, language, arabicVariant)}
      </div>
    </div>
  );
}

function ViewSwitch({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const grid = readGrid(savedState).some((row) => row.includes(-1)) ? TARGET : readGrid(savedState);
  const mode = typeof savedState.mode === "string" ? savedState.mode : "character";
  const viewed = new Set(Array.isArray(savedState.viewed) ? (savedState.viewed as string[]) : [mode]);
  function setMode(nextMode: string) {
    viewed.add(nextMode);
    const completed = ["character", "numbers", "both"].every((item) => viewed.has(item));
    const state = { ...savedState, mode: nextMode, viewed: Array.from(viewed), completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }
  return (
    <div className="interaction-card matrix-lab pixel-view-switch">
      <div className="button-row">
        {[
          { id: "character", label: { ar: "\u0627\u0644\u0635\u0648\u0631\u0629", ar_fusha: "\u0627\u0644\u0635\u0648\u0631\u0629", en: "Picture" } },
          { id: "numbers", label: { ar: "\u0627\u0644\u0623\u0631\u0642\u0627\u0645", ar_fusha: "\u0627\u0644\u0623\u0639\u062f\u0627\u062f", en: "Numbers" } },
          { id: "both", label: { ar: "\u0645\u0639\u064b\u0627", ar_fusha: "\u0645\u0639\u064b\u0627", en: "Both" } }
        ].map((item) => <button className="button" aria-pressed={mode === item.id} key={item.id} type="button" onClick={() => setMode(item.id)}>{t(item.label, language, arabicVariant)}</button>)}
      </div>
      <PixelGrid grid={grid} mode={mode} />
      <div className="meaning-box">{t({ ar: "\u0627\u0644\u0630\u064a \u062a\u063a\u064a\u0651\u0631 \u0647\u0648 \u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u0639\u0631\u0636 \u0641\u0642\u0637. \u0627\u0644\u0642\u064a\u0645 \u0641\u064a \u0627\u0644\u0645\u0635\u0641\u0648\u0641\u0629 \u0647\u064a \u0646\u0641\u0633\u0647\u0627.", ar_fusha: "\u0627\u0644\u0630\u064a \u062a\u063a\u064a\u0651\u0631 \u0647\u0648 \u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u0639\u0631\u0636 \u0641\u0642\u0637. \u0627\u0644\u0642\u064a\u0645 \u0641\u064a \u0627\u0644\u0645\u0635\u0641\u0648\u0641\u0629 \u0647\u064a \u0646\u0641\u0633\u0647\u0627.", en: "Only the view changed. The values in the matrix stayed the same." }, language, arabicVariant)}</div>
    </div>
  );
}

function EditMatrix({ language, arabicVariant, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const grid = readGrid(savedState).some((row) => row.includes(-1)) ? TARGET.map((row) => [...row]) : readGrid(savedState);
  const actions = new Set(Array.isArray(savedState.actions) ? (savedState.actions as string[]) : []);
  const [swapPhase, setSwapPhase] = useState(false);
  const [changedCell, setChangedCell] = useState(typeof savedState.changedCell === "string" ? savedState.changedCell : "");
  const complete = ["change", "zero", "swap"].every((action) => actions.has(action));

  function commit(nextGrid: number[][], action: string, cell = "") {
    const nextActions = new Set(actions);
    nextActions.add(action);
    const completed = ["change", "zero", "swap"].every((item) => nextActions.has(item));
    const state = { ...savedState, grid: nextGrid, actions: Array.from(nextActions), changedCell: cell, completed };
    onStateChange(state);
    if (completed) onComplete(state);
  }

  function randomCell() {
    const row = Math.floor(Math.random() * grid.length);
    const col = Math.floor(Math.random() * grid[row].length);
    const current = grid[row][col];
    const choices = PALETTE_VALUES.filter((value) => value !== current);
    const next = grid.map((line) => [...line]);
    next[row][col] = choices[Math.floor(Math.random() * choices.length)];
    const cell = `${row}-${col}`;
    setChangedCell(cell);
    commit(next, "change", cell);
  }

  function zeroCell() {
    const filled = grid.flatMap((row, rowIndex) => row.map((value, colIndex) => ({ rowIndex, colIndex, value }))).filter((cell) => cell.value !== 0);
    if (filled.length === 0) return;
    const picked = filled[Math.floor(Math.random() * filled.length)];
    const next = grid.map((line) => [...line]);
    next[picked.rowIndex][picked.colIndex] = 0;
    const cell = `${picked.rowIndex}-${picked.colIndex}`;
    setChangedCell(cell);
    commit(next, "zero", cell);
  }

  function swapRows() {
    if (swapPhase) return;
    setChangedCell("");
    setSwapPhase(true);
    window.setTimeout(() => {
      const next = grid.map((row) => [...row]);
      [next[1], next[6]] = [next[6], next[1]];
      setSwapPhase(false);
      commit(next, "swap");
    }, 650);
  }

  return (
    <div className="interaction-card matrix-lab edit-matrix-lab">
      <div className="pixel-character-grid edit-matrix-grid" aria-label="editable pixel matrix">
        {grid.flatMap((row, r) => row.map((value, c) => {
          const id = `${r}-${c}`;
          const swap = swapPhase && r === 1 ? "down" : swapPhase && r === 6 ? "up" : undefined;
          return (
            <span className="pixel-art-cell static" data-edited={changedCell === id} data-swap-row={swap} key={id} style={{ background: COLORS[value], color: cellTextColor(value) }}>
              {value}
            </span>
          );
        }))}
      </div>
      <div className="button-row">
        <button className="button primary" type="button" onClick={randomCell}>{t({ ar: "\u063a\u064a\u0651\u0631 \u0628\u0643\u0633\u0644", ar_fusha: "\u063a\u064a\u0651\u0631 \u0628\u0643\u0633\u0644\u064b\u0627", en: "Change a pixel" }, language, arabicVariant)}</button>
        <button className="button" type="button" onClick={zeroCell}>{t({ ar: "\u0635\u0641\u0651\u0631 \u0628\u0643\u0633\u0644", ar_fusha: "\u0627\u062c\u0639\u0644 \u0628\u0643\u0633\u0644\u064b\u0627 \u0635\u0641\u0631\u064b\u0627", en: "Set a pixel to 0" }, language, arabicVariant)}</button>
        <button className="button" type="button" disabled={swapPhase} onClick={swapRows}>{t({ ar: "\u0628\u062f\u0651\u0644 \u0635\u0641\u064a\u0646", ar_fusha: "\u0628\u062f\u0651\u0644 \u0635\u0641\u064a\u0646", en: "Swap two rows" }, language, arabicVariant)}</button>
        <button className="button" type="button" onClick={() => onStateChange({ grid: TARGET.map((row) => [...row]), actions: [], changedCell: "", completed: false })}>{t({ ar: "\u0625\u0639\u0627\u062f\u0629", ar_fusha: "\u0625\u0639\u0627\u062f\u0629", en: "Reset" }, language, arabicVariant)}</button>
      </div>
      <div className="meaning-box" aria-live="polite">
        {complete
          ? t({ ar: "\u062a\u063a\u064a\u064a\u0631 \u062e\u0644\u064a\u0629 \u0623\u0648 \u0635\u0641 \u064a\u063a\u064a\u0651\u0631 \u0627\u0644\u0635\u0648\u0631\u0629. \u0647\u0630\u0627 \u062a\u0639\u062f\u064a\u0644 \u0644\u0644\u0645\u0635\u0641\u0648\u0641\u0629\u060c \u0648\u0644\u064a\u0633 \u0636\u0631\u0628 \u0645\u0635\u0641\u0648\u0641\u0627\u062a.", ar_fusha: "\u062a\u063a\u064a\u064a\u0631 \u062e\u0644\u064a\u0629 \u0623\u0648 \u0635\u0641 \u064a\u063a\u064a\u0651\u0631 \u0627\u0644\u0635\u0648\u0631\u0629. \u0647\u0630\u0627 \u062a\u0639\u062f\u064a\u0644 \u0644\u0644\u0645\u0635\u0641\u0648\u0641\u0629\u060c \u0648\u0644\u064a\u0633 \u0636\u0631\u0628 \u0645\u0635\u0641\u0648\u0641\u0627\u062a.", en: "Changing a cell or row changes the image. This edits a matrix; it is not matrix multiplication." }, language, arabicVariant)
          : t({ ar: "\u062c\u0631\u0651\u0628 \u0627\u0644\u0623\u0632\u0631\u0627\u0631. \u0631\u0627\u0642\u0628 \u0643\u064a\u0641 \u064a\u063a\u064a\u0651\u0631 \u0627\u0644\u0631\u0642\u0645 \u0645\u0643\u0627\u0646\u0647 \u0641\u064a \u0627\u0644\u0635\u0648\u0631\u0629.", ar_fusha: "\u062c\u0631\u0651\u0628 \u0627\u0644\u0623\u0632\u0631\u0627\u0631. \u0631\u0627\u0642\u0628 \u0643\u064a\u0641 \u064a\u063a\u064a\u0651\u0631 \u0627\u0644\u0639\u062f\u062f \u0645\u0643\u0627\u0646\u0647 \u0641\u064a \u0627\u0644\u0635\u0648\u0631\u0629.", en: "Try the buttons. Watch how a number changes its spot in the image." }, language, arabicVariant)}
      </div>
    </div>
  );
}