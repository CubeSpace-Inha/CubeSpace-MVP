import { useEffect, useRef, useState } from "react";
import type { CubeSpaceApi, Slot, Snapshot } from "@cubespace/protocol";
import { pairPhase } from "../model/settings";

// 장치 추가 흐름(시안 pairStart). 등록은 core가 한다: 시작하면 켜진 미등록 큐브를 세고,
// 확인점에 올린 순서대로 빈 슬롯에 등록한다(스냅샷 pairing). 완료 · 찾은 큐브 없음은 1.7초 뒤 처음으로 돌아간다.
export function usePairing(s: Snapshot, api: CubeSpaceApi, onRegistered: (slot: Slot) => void) {
  const [none, setNone] = useState(false);
  const phase = pairPhase(s, none);
  const done = s.pairing?.done;
  // 이미 알린 등록 수. 화면을 연 뒤 등록된 것만 알린다
  const seen = useRef(done?.length ?? 0);

  useEffect(() => {
    if (!done) {
      seen.current = 0;
      return;
    }
    for (const slot of done.slice(seen.current)) onRegistered(slot);
    seen.current = done.length;
  }, [done, onRegistered]);

  useEffect(() => {
    if (phase !== "none" && phase !== "done") return;
    const t = setTimeout(() => (phase === "none" ? setNone(false) : void api.stopPairing()), 1700);
    return () => clearTimeout(t);
  }, [phase, api]);

  // 화면을 떠나면 등록을 끝낸다. 보는 화면 없이 켜진 미등록 큐브가 확인점에 오면 조용히 등록되므로
  const pairing = useRef(!!s.pairing);
  useEffect(() => {
    pairing.current = !!s.pairing;
  });
  useEffect(
    () => () => {
      if (pairing.current) void api.stopPairing();
    },
    [api],
  );

  return {
    phase,
    start: () => void api.startPairing().then((n) => setNone(n === 0)),
    stop: () => void api.stopPairing(),
  };
}
