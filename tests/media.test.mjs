import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/media.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

for (const basePath of ["", "/ByteSize-AI"]) {
  test(`media URLs work with base path '${basePath}'`, () => {
    const module = { exports: {} };
    vm.runInNewContext(output, {
      exports: module.exports,
      module,
      process: { env: { NEXT_PUBLIC_BASE_PATH: basePath } }
    });
    const { withBasePath } = module.exports;
    assert.equal(withBasePath("/content-media/byte/media/3x3 plate.stl"), `${basePath}/content-media/byte/media/3x3 plate.stl`);
    for (const url of ["", "images/photo.jpg", "https://example.com/photo.jpg", "//example.com/photo.jpg", "data:image/png;base64,abc"]) {
      assert.equal(withBasePath(url), url);
    }
  });
}
