import { expect, test } from "vitest";
import { OK, PAD_LOST } from "../src/renderer/dev/fixtures";

// 견본이 서로 맞물리는지: 가리키는 id · 이름이 실제로 있어야 한다.
test.each([
  ["OK", OK],
  ["PAD_LOST", PAD_LOST],
])("견본 %s의 참조가 모두 있다", (_, s) => {
  const windows = new Set(s.windows.map((w) => w.id));
  const names = new Set(s.cubes.map((c) => c.name));
  const slots = new Set(s.cubes.map((c) => c.slot));

  for (const c of s.cubes) {
    if (c.window) expect(windows).toContain(c.window);
    expect(c.link === "down").toBe(c.downReason !== undefined);
  }
  for (const w of s.windows) if (w.owner) expect(names).toContain(w.owner);
  for (const p of s.layout) expect(windows).toContain(p.window);
  for (const c of s.settings.cubes) expect(slots).toContain(c.slot);
  expect(slots.size).toBe(s.cubes.length);
});
