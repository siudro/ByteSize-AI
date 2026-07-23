import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/timer.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020
  }
}).outputText;
const module = { exports: {} };

vm.runInNewContext(output, { exports: module.exports, module });

const { formatTimerTime, normalizeTimerConfig, resolveTimerAlert } = module.exports;

test("normalizes author-controlled timer duration", () => {
  const timer = normalizeTimerConfig({ duration_seconds: "60" });

  assert.equal(timer.duration_seconds, 60);
  assert.equal(timer.completion_required, true);
  assert.equal(timer.completion_feedback, undefined);
  assert.equal(timer.alert, undefined);
  assert.equal(normalizeTimerConfig({ duration_seconds: 0 }), null);
});

test("resolves stimulus-specific timer alerts", () => {
  const alert = resolveTimerAlert(
    {
      stimulus: {
        low: { audio: false, intensity: "soft" },
        high: { audio: true, intensity: "high" }
      }
    },
    "high"
  );

  assert.equal(alert.visual, true);
  assert.equal(alert.audio, true);
  assert.equal(alert.intensity, "high");
});

test("formats countdown time as minutes and seconds", () => {
  assert.equal(formatTimerTime(60), "1:00");
  assert.equal(formatTimerTime(9), "0:09");
  assert.equal(formatTimerTime(-2), "0:00");
});
