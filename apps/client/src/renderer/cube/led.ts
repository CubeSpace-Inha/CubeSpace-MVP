// LED 도안과 계산. 시안 pad-home.html의 ICON_PALETTE · ICON_ROWS(정본 work/build_pad_ui_images.py)와 패드 LED 테두리(ledFrame).

export type Pixels = (string | null)[]; // 8 × 8 = 64칸, 행 우선. null = 꺼짐, 나머지는 CSS 색

// 도안 글자 → 색. '.'은 꺼짐.
export const ICON_PALETTE: Record<string, string> = {
  R: "rgb(234 67 53)",
  G: "rgb(52 168 83)",
  Y: "rgb(251 188 5)",
  B: "rgb(66 133 244)",
  W: "rgb(245 246 248)",
  r: "rgb(255 24 24)",
  V: "rgb(0 153 235)",
  K: "rgb(254 229 0)",
  O: "rgb(245 166 35)",
  g: "rgb(60 230 120)",
  "#": "rgb(245 246 248)",
};

export const ICON_ROWS = {
  vscode: [".....VV.", "V...VVV.", ".V.V.VV.", "..V..VV.", "..V..VV.", ".V.V.VV.", "V...VVV.", ".....VV."],
  code: ["........", "........", "..B.W.B.", ".B..W..B", "B..W...B", ".B.W..B.", "..BW.B..", "........"],
  doc: [".WWWWW..", ".WWWWWW.", ".W....W.", ".WWWWWW.", ".W....W.", ".WWWWWW.", ".W..WWW.", ".WWWWWW."],
  search: [".WWW....", "W...W...", "W...W...", "W...W...", ".WWW....", "....O...", ".....O..", "......O."],
  prompt: [".WWWWWW.", "W......W", "W.g....W", "W..g...W", "W.g.gg.W", "W......W", ".WW.WWW.", ".W......"],
  // 아래는 정본에 없는 가안(U-92 도안 전)
  edge: ["........", "..VVVV..", ".V....V.", ".VVVVVV.", ".V......", ".V....V.", "..VVVV..", "........"],
  notepad: [".VVVVVV.", ".WWWWWW.", ".W....W.", ".WWWWWW.", ".W....W.", ".WWWWWW.", ".W....W.", ".WWWWWW."],
  frame: ["WWWWWWWW", "W......W", "W......W", "W......W", "W......W", "W......W", "W......W", "WWWWWWWW"],
  project: ["........", ".WWW....", ".W.WWWW.", ".W....W.", ".W....W.", ".W....W.", ".WWWWWW.", "........"],
};

// 등록 아이콘: 큐브를 등록할 때 고르는 도안('#' = 켬). 맡은 것의 도안이 없을 때 큐브 위에 보인다.
export const REG_ICONS: Record<string, string[]> = {
  code: ["........", "..#..#..", ".#....#.", "#......#", ".#....#.", "..#..#..", "........", "........"],
  globe: ["..####..", ".#.##.#.", "#..##..#", "########", "#..##..#", ".#.##.#.", "..####..", "........"],
  bolt: ["....###.", "...###..", "..###...", ".######.", "...###..", "..###...", ".###....", "##......"],
  book: ["########", "#..#...#", "#..#.#.#", "#..#...#", "#..#.#.#", "#..#...#", "########", "........"],
  music: ["...#####", "...#...#", "...#...#", "...#...#", ".###.###", "####.###", ".##..##.", "........"],
  play: ["##......", "####....", "######..", "########", "######..", "####....", "##......", "........"],
  mail: ["########", "##....##", "#.#..#.#", "#..##..#", "#......#", "#......#", "########", "........"],
  chat: [".######.", "########", "########", "########", ".######.", "..###...", "...#....", "........"],
  heart: [".##..##.", "########", "########", "########", ".######.", "..####..", "...##...", "........"],
  star: ["...##...", "...##...", "########", ".######.", "..####..", ".##..##.", "##....##", "........"],
  smile: ["..####..", ".#....#.", "#.#..#.#", "#......#", "#.#..#.#", "#..##..#", ".#....#.", "..####.."],
  flame: ["....#...", "...##...", "..###...", "..####.#", "#.#####.", "#######.", ".#####..", "..###..."],
};

export function toPixels(rows: string[], palette: Record<string, string> = ICON_PALETTE): Pixels {
  return rows
    .join("")
    .split("")
    .map((ch) => (ch === "." ? null : (palette[ch] ?? null)));
}

export const OFF: Pixels = Array(64).fill(null);

// 패드 LED 24 × 16. 영역(0~1 비율 [x0, y0, x1, y1])을 칸 경계에 맞춰 바깥 한 줄만 켠다.
export const PAD_COLS = 24;
export const PAD_ROWS = 16;
export type PadLed = { i: number; color: string; b: number }; // i = y × 24 + x, b = 밝기 0~1

export function outlineLeds(rect: [number, number, number, number], color: string, b: number): PadLed[] {
  const [x0, y0, x1, y1] = [rect[0] * PAD_COLS, rect[1] * PAD_ROWS, rect[2] * PAD_COLS, rect[3] * PAD_ROWS].map(
    Math.round,
  );
  const out: PadLed[] = [];
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++)
      if (x === x0 || x === x1 - 1 || y === y0 || y === y1 - 1) out.push({ i: y * PAD_COLS + x, color, b });
  return out;
}
