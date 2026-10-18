// @vitest-environment node
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { readSource, writeSource } from "../src/main/source";

test("저장한 적 없으면 sw, 저장하면 그 값", () => {
  const dir = mkdtempSync(join(tmpdir(), "cs-src-"));
  expect(readSource(dir)).toBe("sw");
  writeSource(dir, "hw");
  expect(readSource(dir)).toBe("hw");
  writeSource(dir, "sw");
  expect(readSource(dir)).toBe("sw");
});
