import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseEnvelope, PROTOCOL_VERSION } from "../src/envelope";

// 견본은 C#(win-driver)도 같이 읽는다. 여기서는 봉투 모양과 type만 확인한다.
const dir = join(__dirname, "../fixtures");
const TYPES: Record<string, string[]> = {
  win: ["listWindows", "listMonitors", "applyLayout", "command", "launch", "result", "windowOpened", "windowClosed"],
  pad: ["hello", "sync", "cube", "button", "diag", "led"],
};

describe("fixtures", () => {
  for (const group of Object.keys(TYPES))
    for (const f of readdirSync(join(dir, group)))
      it(`${group}/${f}`, () => {
        const e = parseEnvelope(readFileSync(join(dir, group, f), "utf8"));
        expect(e.v).toBe(PROTOCOL_VERSION);
        expect(TYPES[group]).toContain(e.type);
      });
});

describe("parseEnvelope", () => {
  it("모양이 틀리면 던진다", () => {
    expect(() => parseEnvelope("[]")).toThrow();
    expect(() => parseEnvelope('{"v":1,"type":"x","ts":1}')).toThrow("payload");
    expect(() => parseEnvelope('{"v":1,"type":"x","ts":1,"payload":{},"id":3}')).toThrow("id");
  });
});
