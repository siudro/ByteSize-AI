"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type { ArabicVariantCode, LanguageCode } from "@/lib/schema";

type StlModelViewerProps = {
  src: string;
  label: string;
  language: LanguageCode;
  arabicVariant: ArabicVariantCode;
};

type Mesh = {
  positions: Float32Array;
  normals: Float32Array;
};

type Status = "loading" | "ready" | "error";

const NUMBER = "[-+]?\\d*\\.?\\d+(?:[eE][-+]?\\d+)?";
const RED = new Float32Array([0.82, 0.045, 0.07]);

function normalizeMesh(vertices: number[]): Mesh {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  for (let i = 0; i < vertices.length; i += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], vertices[i + axis]);
      max[axis] = Math.max(max[axis], vertices[i + axis]);
    }
  }

  const center = min.map((value, axis) => (value + max[axis]) / 2);
  const size = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2], 1);
  const positions = new Float32Array(vertices.length);

  for (let i = 0; i < vertices.length; i += 3) {
    positions[i] = (vertices[i] - center[0]) / (size / 2);
    positions[i + 1] = (vertices[i + 1] - center[1]) / (size / 2);
    positions[i + 2] = (vertices[i + 2] - center[2]) / (size / 2);
  }

  const normals = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i + 3] - positions[i];
    const ay = positions[i + 4] - positions[i + 1];
    const az = positions[i + 5] - positions[i + 2];
    const bx = positions[i + 6] - positions[i];
    const by = positions[i + 7] - positions[i + 1];
    const bz = positions[i + 8] - positions[i + 2];
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    const length = Math.hypot(nx, ny, nz) || 1;

    for (let vertex = 0; vertex < 3; vertex += 1) {
      const offset = i + vertex * 3;
      normals[offset] = nx / length;
      normals[offset + 1] = ny / length;
      normals[offset + 2] = nz / length;
    }
  }

  return { positions, normals };
}

function parseStl(buffer: ArrayBuffer): Mesh {
  if (buffer.byteLength >= 84) {
    const view = new DataView(buffer);
    const triangleCount = view.getUint32(80, true);
    const expectedSize = 84 + triangleCount * 50;

    if (triangleCount > 0 && expectedSize <= buffer.byteLength) {
      const vertices: number[] = [];
      for (let triangle = 0; triangle < triangleCount; triangle += 1) {
        const offset = 84 + triangle * 50 + 12;
        for (let vertex = 0; vertex < 3; vertex += 1) {
          const vertexOffset = offset + vertex * 12;
          vertices.push(
            view.getFloat32(vertexOffset, true),
            view.getFloat32(vertexOffset + 4, true),
            view.getFloat32(vertexOffset + 8, true)
          );
        }
      }
      return normalizeMesh(vertices);
    }
  }

  const text = new TextDecoder().decode(buffer);
  const vertices = [...text.matchAll(new RegExp(`vertex\\s+(${NUMBER})\\s+(${NUMBER})\\s+(${NUMBER})`, "gi"))]
    .flatMap((match) => [Number(match[1]), Number(match[2]), Number(match[3])]);

  if (vertices.length < 9 || vertices.length % 9 !== 0 || vertices.some((value) => !Number.isFinite(value))) {
    throw new Error("Unsupported or invalid STL file");
  }

  return normalizeMesh(vertices);
}

type Matrix = Float32Array;

function identity(): Matrix {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function multiply(a: Matrix, b: Matrix): Matrix {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      result[column * 4 + row] =
        a[row] * b[column * 4] +
        a[4 + row] * b[column * 4 + 1] +
        a[8 + row] * b[column * 4 + 2] +
        a[12 + row] * b[column * 4 + 3];
    }
  }
  return result;
}

function perspective(fov: number, aspect: number, near: number, far: number): Matrix {
  const scale = 1 / Math.tan(fov / 2);
  return new Float32Array([
    scale / aspect, 0, 0, 0,
    0, scale, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0
  ]);
}

function translate(z: number): Matrix {
  const result = identity();
  result[14] = z;
  return result;
}

function rotateX(angle: number): Matrix {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return new Float32Array([1, 0, 0, 0, 0, cos, sin, 0, 0, -sin, cos, 0, 0, 0, 0, 1]);
}

function rotateY(angle: number): Matrix {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return new Float32Array([cos, 0, -sin, 0, 0, 1, 0, 0, sin, 0, cos, 0, 0, 0, 0, 1]);
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uProjection;
    uniform mat4 uModel;
    varying vec3 vNormal;
    void main() {
      vNormal = vec3(uModel * vec4(aNormal, 0.0));
      gl_Position = uProjection * uModel * vec4(aPosition, 1.0);
    }
  `);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform vec3 uColor;
    varying vec3 vNormal;
    void main() {
      vec3 lightDirection = normalize(vec3(-0.45, 0.8, 1.0));
      float light = 0.42 + 0.58 * max(dot(normalize(vNormal), lightDirection), 0.0);
      gl_FragColor = vec4(uColor * light, 1.0);
    }
  `);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create WebGL program");
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "WebGL program linking failed";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function drawModel(canvas: HTMLCanvasElement, mesh: Mesh, reducedMotion: boolean) {
  const context = canvas.getContext("webgl", { alpha: true, antialias: true });
  if (!context) throw new Error("WebGL is not supported");
  const gl = context;

  const program = createProgram(gl);
  const positionBuffer = gl.createBuffer();
  const normalBuffer = gl.createBuffer();
  if (!positionBuffer || !normalBuffer) throw new Error("Unable to create model buffers");

  const positionLocation = gl.getAttribLocation(program, "aPosition");
  const normalLocation = gl.getAttribLocation(program, "aNormal");
  const projectionLocation = gl.getUniformLocation(program, "uProjection");
  const modelLocation = gl.getUniformLocation(program, "uModel");
  const colorLocation = gl.getUniformLocation(program, "uColor");
  if (positionLocation < 0 || normalLocation < 0 || !projectionLocation || !modelLocation || !colorLocation) {
    throw new Error("Unable to bind model shader");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(normalLocation);
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);
  gl.uniform3fv(colorLocation, RED);
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);

  let angle = 0;
  let previousTime = performance.now();
  let frame = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
  }

  function render(now: number) {
    const elapsed = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    if (!reducedMotion) angle += elapsed * 0.75;
    resize();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(projectionLocation, false, perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100));
    const model = multiply(translate(-3.2), multiply(rotateY(angle), rotateX(-0.42)));
    gl.uniformMatrix4fv(modelLocation, false, model);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.positions.length / 3);
    frame = requestAnimationFrame(render);
  }

  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
  observer?.observe(canvas);
  frame = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(frame);
    observer?.disconnect();
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(normalBuffer);
    gl.deleteProgram(program);
  };
}

export function StlModelViewer({ src, label, language, arabicVariant }: StlModelViewerProps) {
  const [status, setStatus] = useState<Status>("loading");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const modelCanvas = canvas;
    const controller = new AbortController();
    let cleanup: (() => void) | undefined;

    async function load() {
      try {
        setStatus("loading");
        const response = await fetch(src, { signal: controller.signal });
        if (!response.ok) throw new Error(`Failed to load STL: ${response.status}`);
        const mesh = parseStl(await response.arrayBuffer());
        if (controller.signal.aborted) return;
        cleanup = drawModel(modelCanvas, mesh, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        setStatus("ready");
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setStatus("error");
        }
      }
    }

    load();
    return () => {
      controller.abort();
      cleanup?.();
    };
  }, [src]);

  const statusText = status === "loading"
    ? t({ ar: "جارٍ تحميل النموذج ثلاثي الأبعاد…", ar_fusha: "جارٍ تحميل النموذج ثلاثي الأبعاد…", en: "Loading 3D model…" }, language, arabicVariant)
    : t({ ar: "تعذّر عرض النموذج ثلاثي الأبعاد.", ar_fusha: "تعذّر عرض النموذج ثلاثي الأبعاد.", en: "The 3D model could not be displayed." }, language, arabicVariant);

  return (
    <div className="stl-model-viewer" role="img" aria-label={label}>
      <canvas ref={canvasRef} aria-hidden="true" />
      {status !== "ready" ? <span className="stl-model-status" role="status">{statusText}</span> : null}
    </div>
  );
}
