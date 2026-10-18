import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";
import type { CubeSpaceApi } from "@cubespace/protocol";
import { createFakeApi } from "./fakeApi";
import { OK, PAD_LOST } from "../src/renderer/dev/fixtures";
import { useSnapshot } from "../src/renderer/hooks/useSnapshot";

test("처음 한 장을 받아 오고, push한 상태로 바뀐다", async () => {
  const { api, push } = createFakeApi();
  const { result } = renderHook(() => useSnapshot(api));
  expect(result.current.snapshot).toBeNull();

  await waitFor(() => expect(result.current.snapshot).toBe(OK));
  act(() => push(PAD_LOST));
  expect(result.current.snapshot).toBe(PAD_LOST);
});

test("처음 응답보다 바뀐 상태가 먼저 오면 늦은 처음 응답은 버린다", async () => {
  const { api, push } = createFakeApi();
  let resolve: (s: typeof OK) => void = () => {};
  const slow: CubeSpaceApi = {
    ...api,
    getSnapshot: () => new Promise((r) => (resolve = r)),
  };
  const { result } = renderHook(() => useSnapshot(slow));

  act(() => push(PAD_LOST));
  await act(async () => resolve(OK));
  expect(result.current.snapshot).toBe(PAD_LOST);
});

test("받아 오기에 실패하면 error에 담는다", async () => {
  const { api } = createFakeApi();
  const broken: CubeSpaceApi = {
    ...api,
    getSnapshot: () => Promise.reject(new Error("패드 없음")),
  };
  const { result } = renderHook(() => useSnapshot(broken));
  await waitFor(() => expect(result.current.error).toBe("패드 없음"));
});

test("언마운트하면 구독을 끊는다", () => {
  const { api } = createFakeApi();
  let offCalls = 0;
  const counted: CubeSpaceApi = {
    ...api,
    onSnapshot(listener) {
      const off = api.onSnapshot(listener);
      return () => {
        offCalls++;
        off();
      };
    },
  };
  const { unmount } = renderHook(() => useSnapshot(counted));
  unmount();
  expect(offCalls).toBe(1);
});
