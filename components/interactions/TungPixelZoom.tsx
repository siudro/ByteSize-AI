"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { withBasePath } from "@/lib/media";
import type { InteractionComponentProps, InteractionState } from "./types";

const DEFAULT_IMAGE_URL = "/content-media/L1-ENG-MATRIX-RAM/media/images/pixelated-triple-t.jpg";
const CANVAS_SIZE = 560;
const COMPLETE_ZOOM = 128;
const VALUE_GRID_SIZE = 5;

type RgbCell = {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
};

type GrayCell = {
  x: number;
  y: number;
  value: number;
};

type DrawRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type GuideLines = {
  x1: number;
  y1: number;
  x2: number;
  topY: number;
  bottomY: number;
};

const copy = {
  zoomIn: { ar: "تكبير", ar_fusha: "تكبير", en: "Zoom in" },
  zoomOut: { ar: "تصغير", ar_fusha: "تصغير", en: "Zoom out" },
  rgbValues: { ar: "\u0642\u064a\u0645 RGB \u0627\u0644\u0645\u062e\u0632\u0646\u0629 \u062f\u0627\u062e\u0644 \u0627\u0644\u0628\u0643\u0633\u0644\u0627\u062a", ar_fusha: "\u0642\u064a\u0645 RGB \u0627\u0644\u0645\u062e\u0632\u0646\u0629 \u062f\u0627\u062e\u0644 \u0627\u0644\u0628\u0643\u0633\u0644\u0627\u062a", en: "RGB values stored inside the pixels" },
  loadFailed: { ar: "\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0635\u0648\u0631\u0629", ar_fusha: "\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0635\u0648\u0631\u0629", en: "Image could not load" },
  loading: { ar: "\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0635\u0648\u0631\u0629", ar_fusha: "\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0635\u0648\u0631\u0629", en: "Loading image" },
  zoom: { ar: "\u0643\u0628\u0651\u0631 \u0627\u0644\u0635\u0648\u0631\u0629", ar_fusha: "\u0643\u0628\u0651\u0631 \u0627\u0644\u0635\u0648\u0631\u0629", en: "Zoom into the image" },
  ready: { ar: "\u0627\u0644\u0622\u0646 \u0627\u0644\u0635\u0648\u0631\u0629 \u0635\u0627\u0631\u062a \u0634\u0628\u0643\u0629 \u0628\u0643\u0633\u0644\u0627\u062a. \u0643\u0644 \u0645\u0631\u0628\u0639 \u064a\u0639\u0631\u0636 \u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0644\u0648\u0646 \u0627\u0644\u0645\u062e\u0632\u0646\u0629 \u062f\u0627\u062e\u0644\u0647.", ar_fusha: "\u0627\u0644\u0622\u0646 \u0623\u0635\u0628\u062d\u062a \u0627\u0644\u0635\u0648\u0631\u0629 \u0634\u0628\u0643\u0629 \u0628\u0643\u0633\u0644\u0627\u062a. \u0643\u0644 \u0645\u0631\u0628\u0639 \u064a\u0639\u0631\u0636 \u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0644\u0648\u0646 \u0627\u0644\u0645\u062e\u0632\u0646\u0629 \u062f\u0627\u062e\u0644\u0647.", en: "Now the image is a pixel grid. Each square shows the color numbers stored inside it." },
  hint: { ar: "\u0627\u0633\u062d\u0628 \u0627\u0644\u0634\u0631\u064a\u0637 \u0644\u064a\u0646 \u062a\u062a\u062d\u0648\u0644 \u0627\u0644\u0635\u0648\u0631\u0629 \u0645\u0646 \u0634\u0643\u0644 \u0648\u0627\u0636\u062d \u0625\u0644\u0649 \u0645\u0631\u0628\u0639\u0627\u062a \u0635\u063a\u064a\u0631\u0629.", ar_fusha: "\u0627\u0633\u062d\u0628 \u0627\u0644\u0634\u0631\u064a\u0637 \u062d\u062a\u0649 \u062a\u062a\u062d\u0648\u0644 \u0627\u0644\u0635\u0648\u0631\u0629 \u0645\u0646 \u0634\u0643\u0644 \u0648\u0627\u0636\u062d \u0625\u0644\u0649 \u0645\u0631\u0628\u0639\u0627\u062a \u0635\u063a\u064a\u0631\u0629.", en: "Drag the slider until the clear image becomes small squares." },
  inspectTitle: { ar: "\u0642\u064a\u0645 \u0627\u0644\u0628\u0643\u0633\u0644\u0627\u062a \u062d\u0648\u0644 \u0627\u0644\u0645\u0624\u0634\u0631", ar_fusha: "\u0642\u064a\u0645 \u0627\u0644\u0628\u0643\u0633\u0644\u0627\u062a \u062d\u0648\u0644 \u0627\u0644\u0645\u0624\u0634\u0631", en: "Pixel values around the pointer" },
  inspectHint: { ar: "\u062d\u0631\u0651\u0643 \u0627\u0644\u0645\u0624\u0634\u0631 \u0641\u0648\u0642 \u0635\u0648\u0631\u0629 \u062a\u0648\u0646\u063a. \u0627\u0644\u062e\u0637\u0648\u0637 \u062a\u0643\u0628\u0651\u0631 \u0627\u0644\u0645\u0648\u0636\u0639 \u0625\u0644\u0649 \u0645\u0635\u0641\u0648\u0641\u0629 \u0635\u063a\u064a\u0631\u0629.", ar_fusha: "\u062d\u0631\u0651\u0643 \u0627\u0644\u0645\u0624\u0634\u0631 \u0641\u0648\u0642 \u0635\u0648\u0631\u0629 \u062a\u0648\u0646\u063a. \u0627\u0644\u062e\u0637\u0648\u0637 \u062a\u0643\u0628\u0651\u0631 \u0627\u0644\u0645\u0648\u0636\u0639 \u0625\u0644\u0649 \u0645\u0635\u0641\u0648\u0641\u0629 \u0635\u063a\u064a\u0631\u0629.", en: "Move over the Tung image. The guide lines magnify that spot into a small matrix." }
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function numeric(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function imageUrlFromConfig(config: Record<string, unknown>) {
  return withBasePath(typeof config.image_url === "string" ? config.image_url : DEFAULT_IMAGE_URL);
}

function grayscale(r: number, g: number, b: number) {
  return Math.round(r * 0.299 + g * 0.587 + b * 0.114);
}

function sampleRgbGrid(sourceCanvas: HTMLCanvasElement, centerX: number, centerY: number, zoom: number) {
  const source = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!source) return [];

  const cropWidth = Math.max(VALUE_GRID_SIZE, Math.round(sourceCanvas.width / zoom));
  const cropHeight = Math.max(VALUE_GRID_SIZE, Math.round(sourceCanvas.height / zoom));
  const sx = clamp(Math.round(centerX * sourceCanvas.width - cropWidth / 2), 0, sourceCanvas.width - cropWidth);
  const sy = clamp(Math.round(centerY * sourceCanvas.height - cropHeight / 2), 0, sourceCanvas.height - cropHeight);
  const cells: RgbCell[] = [];

  for (let row = 0; row < VALUE_GRID_SIZE; row += 1) {
    for (let col = 0; col < VALUE_GRID_SIZE; col += 1) {
      const x = clamp(Math.floor(sx + ((col + 0.5) * cropWidth) / VALUE_GRID_SIZE), 0, sourceCanvas.width - 1);
      const y = clamp(Math.floor(sy + ((row + 0.5) * cropHeight) / VALUE_GRID_SIZE), 0, sourceCanvas.height - 1);
      const [r, g, b] = Array.from(source.getImageData(x, y, 1, 1).data);
      cells.push({ x, y, r, g, b });
    }
  }

  return cells;
}

function sampleGrayMatrix(sourceCanvas: HTMLCanvasElement, centerX: number, centerY: number) {
  const source = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!source) return [];

  const cells: GrayCell[] = [];
  for (let row = -1; row <= 1; row += 1) {
    for (let col = -1; col <= 1; col += 1) {
      const x = clamp(centerX + col, 0, sourceCanvas.width - 1);
      const y = clamp(centerY + row, 0, sourceCanvas.height - 1);
      const [r, g, b] = Array.from(source.getImageData(x, y, 1, 1).data);
      cells.push({ x, y, value: grayscale(r, g, b) });
    }
  }
  return cells;
}

function textColor({ r, g, b }: RgbCell) {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#211b14" : "#fff8ec";
}

function grayTextColor(value: number) {
  return value > 150 ? "#211b14" : "#fff8ec";
}

function drawGrayscaleImage(image: HTMLImageElement, canvas: HTMLCanvasElement): DrawRect | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  canvas.width = CANVAS_SIZE;
  canvas.height = Math.round(CANVAS_SIZE * image.naturalHeight / image.naturalWidth);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const x = 0;
  const y = 0;
  const width = CANVAS_SIZE;
  const height = canvas.height;

  ctx.drawImage(image, x, y, width, height);
  const imageData = ctx.getImageData(x, y, width, height);
  for (let index = 0; index < imageData.data.length; index += 4) {
    const gray = grayscale(imageData.data[index], imageData.data[index + 1], imageData.data[index + 2]);
    imageData.data[index] = gray;
    imageData.data[index + 1] = gray;
    imageData.data[index + 2] = gray;
  }
  ctx.putImageData(imageData, x, y);
  return { x, y, width, height };
}

function GrayscaleMatrixInspector(props: InteractionComponentProps) {
  const { language, arabicVariant, config, savedState, onStateChange, onComplete } = props;
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const matrixRef = useRef<HTMLDivElement | null>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const drawRectRef = useRef<DrawRect | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [matrix, setMatrix] = useState<GrayCell[]>([]);
  const [guideLines, setGuideLines] = useState<GuideLines | null>(null);
  const imageUrl = imageUrlFromConfig(config);

  useEffect(() => {
    const image = new Image();
    image.decoding = "async";
    image.src = imageUrl;
    image.onload = () => {
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;
      const source = sourceCanvas.getContext("2d", { willReadFrequently: true });
      source?.drawImage(image, 0, 0);
      sourceRef.current = sourceCanvas;

      const visibleCanvas = canvasRef.current;
      if (visibleCanvas) drawRectRef.current = drawGrayscaleImage(image, visibleCanvas);

      const startX = clamp(Math.round(sourceCanvas.width / 2), 0, sourceCanvas.width - 1);
      const startY = clamp(Math.round(sourceCanvas.height / 2), 0, sourceCanvas.height - 1);
      setMatrix(sampleGrayMatrix(sourceCanvas, startX, startY));
      setLoaded(true);
      setFailed(false);
      onStateChange({ ...savedState, pixelX: startX, pixelY: startY, completed: false });
    };
    image.onerror = () => {
      setFailed(true);
      setLoaded(false);
    };
  }, [imageUrl]);

  function inspect(event: PointerEvent<HTMLCanvasElement>, commit = false) {
    const canvas = canvasRef.current;
    const sourceCanvas = sourceRef.current;
    const drawRect = drawRectRef.current;
    if (!canvas || !sourceCanvas || !drawRect) return;

    const box = canvas.getBoundingClientRect();
    const canvasX = ((event.clientX - box.left) / box.width) * canvas.width;
    const canvasY = ((event.clientY - box.top) / box.height) * canvas.height;
    const insideX = clamp(canvasX, drawRect.x, drawRect.x + drawRect.width);
    const insideY = clamp(canvasY, drawRect.y, drawRect.y + drawRect.height);
    const pixelX = clamp(Math.round(((insideX - drawRect.x) / drawRect.width) * (sourceCanvas.width - 1)), 0, sourceCanvas.width - 1);
    const pixelY = clamp(Math.round(((insideY - drawRect.y) / drawRect.height) * (sourceCanvas.height - 1)), 0, sourceCanvas.height - 1);
    const nextMatrix = sampleGrayMatrix(sourceCanvas, pixelX, pixelY);

    const layoutBox = layoutRef.current?.getBoundingClientRect();
    const matrixBox = matrixRef.current?.getBoundingClientRect();
    if (layoutBox && matrixBox) {
      const targetX = Math.abs(matrixBox.left - event.clientX) < Math.abs(matrixBox.right - event.clientX) ? matrixBox.left : matrixBox.right;
      setGuideLines({
        x1: event.clientX - layoutBox.left,
        y1: event.clientY - layoutBox.top,
        x2: targetX - layoutBox.left,
        topY: matrixBox.top - layoutBox.top,
        bottomY: matrixBox.bottom - layoutBox.top
      });
    }

    setMatrix(nextMatrix);
    if (!commit) return;

    const state = { pixelX, pixelY, value: nextMatrix[4]?.value, completed: true };
    onStateChange(state);
    onComplete(state);
  }

  return (
    <div className="interaction-card matrix-lab tung-gray-inspector" dir={language === "en" ? "ltr" : "rtl"}>
      <div className="gray-inspector-layout" ref={layoutRef}>
        {guideLines ? (
          <svg className="gray-magnifier-lines" aria-hidden="true">
            <line x1={guideLines.x1} y1={guideLines.y1} x2={guideLines.x2} y2={guideLines.topY} />
            <line x1={guideLines.x1} y1={guideLines.y1} x2={guideLines.x2} y2={guideLines.bottomY} />
          </svg>
        ) : null}
        <div className="gray-image-panel">
          <canvas ref={canvasRef} className="gray-inspector-canvas" onPointerMove={inspect} onPointerDown={(event) => inspect(event, true)} aria-label={t(copy.inspectHint, language, arabicVariant)} />
          {!loaded ? <span className="zoom-loading">{failed ? t(copy.loadFailed, language, arabicVariant) : t(copy.loading, language, arabicVariant)}</span> : null}
        </div>
        <div className="gray-matrix-panel">
          <strong>{t(copy.inspectTitle, language, arabicVariant)}</strong>
          <div className="gray-matrix-grid" dir="ltr" ref={matrixRef}>
            {matrix.map((cell, index) => (
              <span className="gray-matrix-cell" key={`${cell.x}-${cell.y}-${index}`} style={{ backgroundColor: `rgb(${cell.value}, ${cell.value}, ${cell.value})`, color: grayTextColor(cell.value) }}>
                {cell.value}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="interaction-hint">{t(copy.inspectHint, language, arabicVariant)}</p>
    </div>
  );
}

function ZoomPixelValues({ language, arabicVariant, config, savedState, onStateChange, onComplete }: InteractionComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [rgbGrids, setRgbGrids] = useState<Record<string, RgbCell[]>>({});

  const imageUrl = imageUrlFromConfig(config);
  const zoom = numeric(savedState.zoom, 1);
  const centerX = numeric(savedState.centerX, 0.5);
  const centerY = numeric(savedState.centerY, 0.5);
  const pixelReady = zoom >= COMPLETE_ZOOM;
  const rgbGrid = pixelReady ? rgbGrids[zoom.toFixed(1)] ?? rgbGrids[COMPLETE_ZOOM.toFixed(1)] ?? [] : [];

  useEffect(() => {
    const image = new Image();
    image.decoding = "async";
    image.src = imageUrl;
    image.onload = () => {
      imageRef.current = image;
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;
      const source = sourceCanvas.getContext("2d", { willReadFrequently: true });
      source?.drawImage(image, 0, 0);
      setRgbGrids({
        [COMPLETE_ZOOM.toFixed(1)]: sampleRgbGrid(sourceCanvas, 0.5, 0.5, COMPLETE_ZOOM)
      });
      setLoaded(true);
      setFailed(false);
      onStateChange({ ...savedState, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight });
    };
    image.onerror = () => {
      setFailed(true);
      setLoaded(false);
    };
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !loaded) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cropSize = Math.max(VALUE_GRID_SIZE, Math.round(image.naturalWidth / zoom));
    const sx = clamp(Math.round(centerX * image.naturalWidth - cropSize / 2), 0, image.naturalWidth - cropSize);
    const sy = clamp(Math.round(centerY * image.naturalHeight - cropSize / 2), 0, image.naturalHeight - cropSize);

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.imageSmoothingEnabled = zoom < COMPLETE_ZOOM;
    ctx.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }, [centerX, centerY, loaded, zoom]);

  function commit(next: InteractionState) {
    const nextZoom = numeric(next.zoom, zoom);
    const done = savedState.completed === true || nextZoom >= COMPLETE_ZOOM;
    const merged = { ...savedState, ...next, completed: done };
    onStateChange(merged);
    if (done) onComplete(merged);
  }

  function zoomBy(step: number) {
    const nextZoom = clamp(zoom + step, 1, COMPLETE_ZOOM);
    if (nextZoom !== zoom) commit({ zoom: nextZoom });
  }

  return (
    <div className="interaction-card matrix-lab real-pixel-zoom" dir={language === "en" ? "ltr" : "rtl"}>
      <div className="real-zoom-frame" aria-live="polite">
        <canvas ref={canvasRef} className={pixelReady ? "real-zoom-canvas values-visible" : "real-zoom-canvas"} />
        {pixelReady && rgbGrid.length > 0 ? (
          <div className="rgb-value-grid" aria-label={t(copy.rgbValues, language, arabicVariant)}>
            {rgbGrid.map((cell) => (
              <div className="rgb-value-cell" key={`${cell.x}-${cell.y}`} style={{ color: textColor(cell) }}>
                <span>R {cell.r}</span>
                <span>G {cell.g}</span>
                <span>B {cell.b}</span>
              </div>
            ))}
          </div>
        ) : null}
        {!loaded ? <span className="zoom-loading">{failed ? t(copy.loadFailed, language, arabicVariant) : t(copy.loading, language, arabicVariant)}</span> : null}
      </div>

      <div className="control-row real-zoom-control">
        <span>{t(copy.zoom, language, arabicVariant)}</span>
        <div className="real-zoom-stepper" dir="ltr">
          <button
            className="icon-button real-zoom-step-button"
            type="button"
            aria-label={t(copy.zoomOut, language, arabicVariant)}
            title={t(copy.zoomOut, language, arabicVariant)}
            disabled={!loaded || zoom <= 1}
            onClick={() => zoomBy(-1)}
          >
            −
          </button>
          <input aria-label={t(copy.zoom, language, arabicVariant)} min={1} max={COMPLETE_ZOOM} step={1} value={zoom} type="range" disabled={!loaded} onChange={(event) => commit({ zoom: Number(event.target.value) })} />
          <button
            className="icon-button real-zoom-step-button"
            type="button"
            aria-label={t(copy.zoomIn, language, arabicVariant)}
            title={t(copy.zoomIn, language, arabicVariant)}
            disabled={!loaded || zoom >= COMPLETE_ZOOM}
            onClick={() => zoomBy(1)}
          >
            +
          </button>
          <strong dir="ltr">{zoom.toFixed(1)}x</strong>
        </div>
      </div>

      <p className="interaction-hint">{pixelReady ? t(copy.ready, language, arabicVariant) : t(copy.hint, language, arabicVariant)}</p>
    </div>
  );
}

export function TungPixelZoom(props: InteractionComponentProps) {
  if (props.stage === "grayscale-matrix") return <GrayscaleMatrixInspector {...props} />;
  return <ZoomPixelValues {...props} />;
}
