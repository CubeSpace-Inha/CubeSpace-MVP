// 로고 후보 20개(A–T). 마크는 고정 SVG 문자열, 표기(lock)는 LogoCards가 그린다.
const C = ["#7c5cff", "#12b5d6", "#f0457a", "#ff8a1f"];

type Pt = [number, number];

// 아이소 큐브 윗면 위의 한 점: 윗면 꼭짓점 t, 오른쪽 · 왼쪽 변 벡터로 (u, v)
const iso = (
  u: number,
  v: number,
  t: Pt = [32, 6],
  r: Pt = [24, 13],
  l: Pt = [-24, 13],
): Pt => [t[0] + u * r[0] + v * l[0], t[1] + u * r[1] + v * l[1]];
const poly = (pts: Pt[], fill: string) =>
  `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${fill}"/>`;
const cell = (u0: number, v0: number, s: number, fill: string) =>
  poly(
    [iso(u0, v0), iso(u0 + s, v0), iso(u0 + s, v0 + s), iso(u0, v0 + s)],
    fill,
  );
// 가운데(cx, cy)가 윗면 중심인 큐브. w = 반폭.
const cube = (
  cx: number,
  cy: number,
  w: number,
  top: string,
  left: string,
  right: string,
) => {
  const h = (w * 13) / 24,
    d = (w * 26) / 24;
  return (
    poly(
      [
        [cx, cy - h],
        [cx + w, cy],
        [cx, cy + h],
        [cx - w, cy],
      ],
      top,
    ) +
    poly(
      [
        [cx - w, cy],
        [cx, cy + h],
        [cx, cy + h + d],
        [cx - w, cy + d],
      ],
      left,
    ) +
    poly(
      [
        [cx + w, cy],
        [cx, cy + h],
        [cx, cy + h + d],
        [cx + w, cy + d],
      ],
      right,
    )
  );
};
const topFace = (cx: number, cy: number, w: number): [Pt, Pt, Pt] => [
  [cx, cy - (w * 13) / 24],
  [w, (w * 13) / 24],
  [-w, (w * 13) / 24],
];

// 점 판: rows의 글자 = 색 번호, "." = 꺼진 점. wave면 물결로 켜진다.
const dots = (
  rows: string[],
  col: Record<string, string>,
  pitch = 6.3,
  r = 2.1,
  wave = false,
  bg = "#23262d",
) => {
  const w = rows[0].length * pitch,
    h = rows.length * pitch,
    x0 = 32 - w / 2 + pitch / 2,
    y0 = 32 - h / 2 + pitch / 2;
  let s = `<svg viewBox="0 0 64 64">${bg === "none" ? "" : `<rect x="2" y="2" width="60" height="60" rx="16" fill="${bg}"/>`}`;
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const on = ch !== ".";
      const anim =
        wave && on
          ? `<animate attributeName="opacity" values=".15;1;1" keyTimes="0;.25;1" dur="2.4s" begin="${(x * 0.08).toFixed(2)}s" repeatCount="indefinite"/>`
          : "";
      s += `<circle cx="${(x0 + x * pitch).toFixed(2)}" cy="${(y0 + y * pitch).toFixed(2)}" r="${r}" fill="${on ? col[ch] : bg === "none" ? "currentColor" : "rgba(255,255,255,.08)"}"${!on && bg === "none" ? ' opacity=".12"' : ""}>${anim}</circle>`;
    }),
  );
  return s + "</svg>";
};

const CS = [
  "........",
  "111.222.",
  "1...2...",
  "1...222.",
  "1.....2.",
  "111.222.",
  "........",
  "3344....",
];
const CS_COL: Record<string, string> = { 1: C[1], 2: C[2], 3: C[3], 4: C[0] };

// 3 × 5 LED 글꼴로 쓴 CUBE / SPACE
const ledWords = () => {
  const F: Record<string, string[]> = {
    C: ["111", "100", "100", "100", "111"],
    U: ["101", "101", "101", "101", "111"],
    B: ["110", "101", "110", "101", "110"],
    E: ["111", "100", "110", "100", "111"],
    S: ["111", "100", "111", "001", "111"],
    P: ["110", "101", "110", "100", "100"],
    A: ["010", "101", "111", "101", "101"],
  };
  const line = (w: string, col: string) =>
    [0, 1, 2, 3, 4].map((y) =>
      [...w].map((ch) => F[ch][y].replaceAll("0", ".").replaceAll("1", col)).join("."),
    );
  const pad = (rs: string[], n: number) =>
    rs.map(
      (x) =>
        ".".repeat((n - x.length) >> 1) +
        x +
        ".".repeat(n - x.length - ((n - x.length) >> 1)),
    );
  return dots(
    [
      ...pad(line("CUBE", "1"), 19),
      ".".repeat(19),
      ...pad(line("SPACE", "2"), 19),
    ],
    { 1: C[1], 2: C[0] },
    2.75,
    1.05,
  );
};

// 실물 큐브 윗면 8 × 8 LED에 CS
const cubeCs = () => {
  const [t, r, l] = topFace(32, 21, 26);
  let o = "";
  CS.forEach((row, v) =>
    [...row].forEach((ch, u) => {
      const [x, y] = iso((u + 0.5) / 8, (v + 0.5) / 8, t, r, l);
      o += `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="0.9" fill="${ch === "." ? "rgba(255,255,255,.1)" : CS_COL[ch]}"/>`;
    }),
  );
  return `<svg viewBox="0 0 64 64">${cube(32, 21, 26, "#2b3039", "#1b1e24", "#252931")}${o}</svg>`;
};

const MARKS: Record<string, string> = {
  A: `<svg viewBox="0 0 64 64">${poly(
    [
      [32, 6],
      [56, 19],
      [32, 32],
      [8, 19],
    ],
    "#3b414d",
  )}${poly(
    [
      [8, 19],
      [32, 32],
      [32, 58],
      [8, 45],
    ],
    "#23262d",
  )}${poly(
    [
      [56, 19],
      [32, 32],
      [32, 58],
      [56, 45],
    ],
    "#2e333d",
  )}${cell(0.14, 0.14, 0.32, C[0])}${cell(0.54, 0.14, 0.32, C[1])}${cell(0.14, 0.54, 0.32, C[2])}${cell(0.54, 0.54, 0.32, C[3])}<path d="M8 19 32 32 56 19M32 32v26" stroke="rgba(255,255,255,.12)" stroke-width="1" fill="none"/></svg>`,
  B: `<svg viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="16" fill="#23262d"/>${C.map((c, i) => `<rect x="${i % 2 ? 34 : 14}" y="${i < 2 ? 14 : 34}" width="16" height="16" rx="4" fill="${c}"/>`).join("")}</svg>`,
  C: `<svg viewBox="0 0 64 64"><rect x="2" y="11" width="60" height="42" rx="9" fill="#2a2e37"/><rect x="7" y="16" width="23" height="32" rx="3" fill="none" stroke="${C[1]}" stroke-width="2.4" stroke-dasharray="0.1 4.2" stroke-linecap="round"/><rect x="34" y="16" width="23" height="32" rx="3" fill="none" stroke="${C[2]}" stroke-width="2.4" stroke-dasharray="0.1 4.2" stroke-linecap="round"/><rect x="12" y="25" width="13" height="13" rx="3" fill="#15171c" stroke="${C[1]}" stroke-width="1.2"/><rect x="39" y="25" width="13" height="13" rx="3" fill="#15171c" stroke="${C[2]}" stroke-width="1.2"/></svg>`,
  D: dots(CS, CS_COL),
  E: `<svg viewBox="0 0 64 64">${poly(
    [
      [32, 10],
      [52, 21],
      [32, 32],
      [12, 21],
    ],
    C[0],
  )}${poly(
    [
      [12, 21],
      [32, 32],
      [32, 54],
      [12, 43],
    ],
    "#5a3fd0",
  )}${poly(
    [
      [52, 21],
      [32, 32],
      [32, 54],
      [52, 43],
    ],
    "#6c50e8",
  )}</svg>`,
  F: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2.8 20.5 7.5v9L12 21.2 3.5 16.5v-9z"/><path d="M3.5 7.5 12 12.2l8.5-4.7M12 12.2v9"/><circle cx="12" cy="7.4" r="1.3" fill="${C[1]}" stroke="none"/></svg>`,
  G: dots(
    [
      "...11...",
      ".111111.",
      "21111113",
      "22211333",
      "22223333",
      "22223333",
      ".222333.",
      "...23...",
    ],
    { 1: C[0], 2: C[1], 3: C[2] },
  ),
  H: dots(
    [
      "..11111.",
      ".1......",
      "1....22.",
      "1....22.",
      "1.......",
      "1.......",
      ".1......",
      "..11111.",
    ],
    { 1: C[1], 2: C[0] },
  ),
  I: ledWords(),
  J: dots(CS, CS_COL, 6.3, 2.1, true),
  K: cubeCs(),
  L: dots(
    [...CS.slice(0, 7), "...4...."],
    { 1: "currentColor", 2: "currentColor", 4: C[0] },
    6.3,
    2.1,
    false,
    "none",
  ),
  M: `<svg viewBox="0 0 64 64"><path fill-rule="evenodd" fill="${C[0]}" d="M2 16A14 14 0 0 1 16 2h32a14 14 0 0 1 14 14v32a14 14 0 0 1-14 14H16A14 14 0 0 1 2 48zM32 14l15.6 9v18L32 50l-15.6-9V23z"/><path d="M16.4 23 32 32l15.6-9M32 32v18" fill="none" stroke="${C[0]}" stroke-width="3" stroke-linejoin="round"/></svg>`,
  N: `<svg viewBox="0 0 64 64">${poly(
    [
      [6, 6],
      [58, 6],
      [42, 22],
      [22, 22],
    ],
    "#23262d",
  )}${poly(
    [
      [6, 6],
      [22, 22],
      [22, 42],
      [6, 58],
    ],
    "#2e333d",
  )}${poly(
    [
      [58, 6],
      [58, 58],
      [42, 42],
      [42, 22],
    ],
    "#3b414d",
  )}${poly(
    [
      [6, 58],
      [58, 58],
      [42, 42],
      [22, 42],
    ],
    C[0],
  )}<rect x="22" y="22" width="20" height="20" fill="#15171c"/><rect x="26" y="26" width="12" height="9" rx="1.5" fill="${C[1]}"/></svg>`,
  O: `<svg viewBox="0 0 64 64">${(
    [
      [25.5, 4, C[0]],
      [25.5, 19, C[1]],
      [10.5, 19, "#3b414d"],
      [40.5, 19, "#3b414d"],
      [25.5, 34, C[2]],
      [25.5, 49, C[3]],
    ] as const
  )
    .map(
      ([x, y, c]) =>
        `<rect x="${x}" y="${y}" width="13" height="13" rx="3" fill="${c}"/>`,
    )
    .join("")}</svg>`,
  P: `<svg viewBox="0 0 64 64" fill="currentColor"><rect x="13" y="6" width="37" height="7" rx="2"/><rect x="43" y="6" width="7" height="26" rx="2"/><rect x="13" y="18" width="30" height="6" rx="2"/><rect x="7" y="38" width="50" height="7" rx="2" fill="${C[0]}"/><rect x="19" y="45" width="7" height="13" rx="2" fill="${C[0]}"/><rect x="38" y="45" width="7" height="13" rx="2" fill="${C[0]}"/></svg>`,
  Q: `<svg viewBox="0 0 64 64"><defs><path id="qarc" d="M32 32m-22.5 0a22.5 22.5 0 1 1 45 0a22.5 22.5 0 1 1-45 0"/></defs><circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="32" r="16.5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/><text font-weight="800" font-size="6" letter-spacing=".9" fill="currentColor"><textPath href="#qarc">CUBE SPACE • WINDOW PAD •</textPath></text>${cube(32, 27, 9, C[0], "#5a3fd0", "#6c50e8")}</svg>`,
  R: `<svg viewBox="0 0 64 64"><rect x="8" y="14" width="48" height="44" rx="12" fill="#5a3fd0"/><rect x="8" y="6" width="48" height="44" rx="12" fill="${C[0]}"/><rect x="20" y="19" width="6" height="8" rx="2" fill="#fff"/><rect x="38" y="19" width="6" height="8" rx="2" fill="#fff"/><path d="M25 34q7 6 14 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="33" r="3" fill="${C[2]}" opacity=".75"/><circle cx="48" cy="33" r="3" fill="${C[2]}" opacity=".75"/></svg>`,
  S: `<svg viewBox="0 0 64 64"><polygon points="8,4 8,38 17,30 23,43 29,40 23,27 35,27" fill="currentColor"/>${cube(42, 38, 15, C[0], "#5a3fd0", "#6c50e8")}<path d="M28 58h28" stroke="${C[1]}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0.1 4.4"/></svg>`,
  T: `<svg viewBox="0 0 64 64"><defs><radialGradient id="tglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${C[1]}" stop-opacity=".9"/><stop offset="1" stop-color="${C[1]}" stop-opacity="0"/></radialGradient><linearGradient id="ttop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C[0]}"/><stop offset="1" stop-color="${C[2]}"/></linearGradient></defs><ellipse cx="32" cy="46" rx="30" ry="14" fill="url(#tglow)"/>${cube(32, 20, 17, "url(#ttop)", "#3b2a9a", "#4a35b8")}</svg>`,
};

// 이름 표기 방식
export type Lock =
  | "between"
  | "stack"
  | "lw"
  | "cubed"
  | "ko"
  | "mono"
  | "just"
  | "grot"
  | "self";
export const LOCK_NAME: Record<Lock, string> = {
  between: "사이에 마크",
  stack: "두 줄",
  lw: "소문자 · 굵기 대비",
  cubed: "space³ (공간의 세제곱)",
  ko: "한글",
  mono: "코드체",
  just: "아래 글자 맞춤",
  grot: "두 줄 · 제목체",
  self: "글자 없음",
};

export type Logo = {
  k: string;
  name: string;
  note: string;
  lock: Lock;
  svg: string;
  tag?: string;
  sec?: string;
};

const LIST: Omit<Logo, "svg">[] = [
  {
    sec: "기본형 A–F",
    k: "A",
    lock: "stack",
    name: "아이소 큐브",
    note: "실물 큐브를 비스듬히 본 모양, 윗면 LED에 4색. 시안 홈 로고(보라 큐브)를 이어받는다.",
    tag: "추천 · 대표",
  },
  {
    k: "B",
    lock: "lw",
    name: "LED 타일",
    note: "시안 왼쪽 위 .logo를 그대로 다듬은 것. 작아도 또렷하고 만들기 쉽다. 큐브라는 느낌은 약하다.",
  },
  {
    k: "C",
    lock: "grot",
    name: "패드 영역",
    note: "패드 위에 창 영역 두 개가 LED 점선으로 켜진 장면. 제품 설명은 가장 잘 되지만 16 px에서는 뭉갠다.",
  },
  {
    k: "D",
    lock: "just",
    name: "LED 모노그램",
    note: "8 × 8 점으로 쓴 CS. 큐브 윗면 해상도 그대로라 기기 화면에도 띄울 수 있다.",
  },
  {
    k: "E",
    lock: "between",
    name: "글자 + 큐브",
    note: "CUBE 와 SPACE 사이 빈칸에 큐브를 넣는 조합. 마크 단독보다 글자 로고용.",
    tag: "추천 · 글자",
  },
  {
    k: "F",
    lock: "mono",
    name: "선 큐브",
    note: "앱의 선 아이콘(24 px, 굵기 1.8)과 같은 문법. 왼쪽 메뉴 · 탭 아이콘에 섞여도 튀지 않는다.",
    tag: "추천 · 작은 곳",
  },
  {
    sec: "D 계열 G–L",
    k: "G",
    lock: "cubed",
    name: "점 큐브",
    note: "8 × 8 점으로 그린 큐브. 면마다 색이 달라 입체가 점만으로 선다. D의 문법 그대로, 글자 대신 큐브.",
    tag: "D 계열",
  },
  {
    k: "H",
    lock: "ko",
    name: "C 속 큐브",
    note: "점으로 쓴 C의 빈 공간(SPACE)에 큐브 한 칸이 켜져 있다. 이름 두 단어를 한 마크에.",
    tag: "D 계열",
  },
  {
    k: "I",
    lock: "self",
    name: "LED 글자",
    note: "3 × 5 점 글꼴로 쓴 CUBE / SPACE. 마크가 곧 글자 로고. 48 px 이상에서만 읽힌다.",
    tag: "D 계열",
  },
  {
    k: "J",
    lock: "just",
    name: "켜지는 D",
    note: "D에 움직임: 점이 왼쪽부터 물결처럼 켜진다. 시작 화면 · 로딩용. 정지 화면은 D와 같다.",
    tag: "D 계열 · 움직임",
  },
  {
    k: "K",
    lock: "stack",
    name: "큐브 위 CS",
    note: "실물 큐브 윗면 8 × 8 LED에 D가 떠 있는 모습. 제품 그대로라 홍보물 · 발표 표지에 맞다.",
    tag: "D 계열",
  },
  {
    k: "L",
    lock: "mono",
    name: "D 한 색",
    note: "D를 글자색 한 가지로, 큐브 자리 점 하나만 보라. 바탕판이 없어 왼쪽 메뉴 · 문서 머리에 얹기 좋다.",
    tag: "D 계열",
  },
  {
    sec: "다른 방향 M–T",
    k: "M",
    lock: "lw",
    name: "빈 큐브",
    note: "판에서 큐브 모양을 도려낸 음각. 비어 있는 큐브 = SPACE. 한 색이라 도장 · 각인 · 스티커에 강하다.",
    tag: "다른 방향",
  },
  {
    k: "N",
    lock: "grot",
    name: "큐브 안의 방",
    note: "큐브 안쪽을 한 점 원근으로 들여다본 모습, 안쪽 벽에 창 하나. '공간'을 밖이 아닌 안에서 그렸다.",
    tag: "다른 방향",
  },
  {
    k: "O",
    lock: "cubed",
    name: "전개도",
    note: "펼친 큐브 6칸. 칸마다 창 색. 접으면 큐브, 펴면 화면 배치라는 이중 의미.",
    tag: "다른 방향",
  },
  {
    k: "P",
    lock: "ko",
    name: "한글 큐",
    note: "'큐'를 블록으로 쌓은 글자 마크. 국내 발표 · 전시에서 이름이 바로 읽힌다. ㅠ가 보라.",
    tag: "다른 방향",
  },
  {
    k: "Q",
    lock: "stack",
    name: "배지",
    note: "둘레에 CUBE SPACE · WINDOW PAD, 가운데 큐브. 스티커 · 굿즈 · 발표 표지 도장용. 16 px에는 안 맞는다.",
    tag: "다른 방향",
  },
  {
    k: "R",
    lock: "lw",
    name: "마스코트",
    note: "LED 눈 · 입이 있는 큐브 캐릭터. 표정을 바꿔 상태(연결 끊김, 충전 중)를 보여줄 수 있다.",
    tag: "다른 방향",
  },
  {
    k: "S",
    lock: "mono",
    name: "커서 + 큐브",
    note: "마우스 커서가 큐브를 패드에 내려놓는 장면. '화면 창을 손으로 옮긴다'는 제품 동작 그대로.",
    tag: "다른 방향",
  },
  {
    k: "T",
    lock: "grot",
    name: "빛나는 큐브",
    note: "보라→분홍 그라데이션 큐브 아래로 패드 LED 빛이 번진다. 평면 시안들과 달리 부드럽고 화려한 쪽.",
    tag: "다른 방향",
  },
];

// sec이 있는 시안에서 새 묶음(탭 한 장)이 시작된다.
export const LOGO_GROUPS = LIST.reduce<{ name: string; logos: Logo[] }[]>((groups, o) => {
  if (o.sec) groups.push({ name: o.sec, logos: [] });
  groups[groups.length - 1].logos.push({ ...o, svg: MARKS[o.k] });
  return groups;
}, []);
