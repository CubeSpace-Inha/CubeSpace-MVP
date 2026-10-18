import type { Envelope } from "@cubespace/protocol";
import type { Conn } from "@cubespace/protocol/pipe";

// pipe 없이 링크를 시험하는 가짜 연결. 보낸 것을 sent에 쌓고, answer로 요청에 답한다.
export function fakeConn(answer: (type: string, payload: unknown) => unknown = () => null) {
  const handlers: ((e: Envelope) => void)[] = [];
  const closers: (() => void)[] = [];
  const sent: { type: string; payload: unknown }[] = [];
  const conn: Conn = {
    send: (type, payload) => void sent.push({ type, payload }),
    reply: () => {},
    request: <T>(type: string, payload: unknown) => {
      sent.push({ type, payload });
      return Promise.resolve(answer(type, payload) as T);
    },
    onMessage: (fn) => void handlers.push(fn),
    onClose: (fn) => void closers.push(fn),
    close: () => closers.forEach((f) => f()),
  };
  const emit = (type: string, payload: unknown) => handlers.forEach((h) => h({ v: 1, type, ts: 0, payload }));
  return { conn, sent, emit };
}
