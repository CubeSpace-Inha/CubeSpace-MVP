import { useEffect, useState } from "react";
import type { CubeSpaceApi } from "@cubespace/protocol";
import type { Snapshot } from "@cubespace/protocol";

// 화면의 유일한 상태 출처. 처음 한 장을 받아 오고, 이후 바뀔 때마다 새로 받는다.
// 처음 응답보다 바뀐 상태가 먼저 오면 늦게 온 처음 응답은 버린다. 받기 전에는 null.
export function useSnapshot(api: CubeSpaceApi) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let changed = false;
    let alive = true;
    const off = api.onSnapshot((s) => {
      changed = true;
      setSnapshot(s);
    });
    api.getSnapshot().then(
      (s) => {
        if (alive && !changed) setSnapshot(s);
      },
      (e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      },
    );
    return () => {
      alive = false;
      off();
    };
  }, [api]);

  return { snapshot, error };
}
