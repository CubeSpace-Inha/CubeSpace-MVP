import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Source } from "@cubespace/protocol";

// HW 통합 후 제거: 화면이 붙을 곳(HW/SW) 선택. userData/source.json에 둔다.
// 기본 sw: pad-gateway(HW)가 아직 없다
const file = (dir: string) => join(dir, "source.json");

export function readSource(dir: string): Source {
  try {
    return JSON.parse(readFileSync(file(dir), "utf8")) === "hw" ? "hw" : "sw";
  } catch {
    return "sw";
  }
}

export function writeSource(dir: string, v: Source) {
  writeFileSync(file(dir), JSON.stringify(v));
}
