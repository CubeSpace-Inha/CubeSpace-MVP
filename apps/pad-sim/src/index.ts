import { createInterface } from "node:readline";
import { pipePath } from "@cubespace/protocol/pipe";
import { runLine, startSim } from "./sim";

// 가상 패드 시작점. core가 띄우거나(--pad dist/pad-sim.cjs) 따로 켜서 stdin으로 조작한다.
const log = (m: string) => console.log(`[pad-sim] ${m}`);

startSim(pipePath("pad"), pipePath("sim"), log).then(
  (sim) => {
    log(`준비됨 ${pipePath("pad")} · 조작 ${pipePath("sim")}`);
    // core가 띄운 경우 stdin이 닫혀 있을 수 있다
    if (!process.stdin.isTTY) return;
    createInterface({ input: process.stdin }).on("line", (line) => {
      try {
        console.log(runLine(sim.ops, line));
      } catch (e) {
        console.log((e as Error).message);
      }
    });
  },
  (e: Error) => {
    log(`시작 실패: ${e.message}`);
    process.exit(1);
  },
);
