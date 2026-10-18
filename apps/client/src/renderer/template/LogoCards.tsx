import { Fragment, useState } from "react";
import { Button } from "../components/Button";
import { Tabs } from "../components/Tabs";
import { LOCK_NAME, LOGO_GROUPS, type Lock } from "./logoMarks";
import "./LogoCards.css";

const SIZES = [16, 24, 48];

// 카탈로그 0판: 로고 후보 A–T. 접어 두고, 펼치면 묶음별로 탭을 넘겨 본다.
export function LogoCards() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);

  return (
    <div className="logo">
      <div className="logo-bar">
        {open && <Tabs options={LOGO_GROUPS.map((g) => g.name)} value={page} onChange={setPage} label="로고 묶음" />}
        <Button size="sm" onClick={() => setOpen(!open)}>
          {open ? "접기" : "로고 후보 20개 보기"}
        </Button>
      </div>
      {open && (
        <div className="logo-grid">
          {LOGO_GROUPS[page].logos.map((o) => (
          <article
            key={o.k}
            className={o.tag ? "logo-opt rec" : "logo-opt"}
            aria-label={`시안 ${o.k} ${o.name}`}
          >
            <div className="logo-head">
              <b>
                {o.k}. {o.name}
              </b>
              {o.tag && <span>{o.tag}</span>}
            </div>
            <div className="logo-plates">
              <Mark svg={o.svg} className="logo-plate d" />
              <Mark svg={o.svg} className="logo-plate l" />
            </div>
            <div className="logo-sizes">
              {SIZES.map((s) => (
                <Fragment key={s}>
                  <span>{s}</span>
                  <Mark svg={o.svg} className="logo-sz" size={s} />
                </Fragment>
              ))}
            </div>
            <div className="logo-lock">
              {o.lock === "between" ? (
                <>
                  <span className="wm inline">CUBE</span>
                  <Mark svg={o.svg} className="logo-lm" />
                  <span className="wm inline">SPACE</span>
                </>
              ) : (
                <>
                  <Mark svg={o.svg} className="logo-lm" />
                  <Wordmark lock={o.lock} />
                </>
              )}
              <small>{LOCK_NAME[o.lock]}</small>
            </div>
            <p className="tpl-p">{o.note}</p>
          </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Mark({
  svg,
  className,
  size,
}: {
  svg: string;
  className: string;
  size?: number;
}) {
  // 고정 문자열만 넣는다(사용자 입력 없음).
  return (
    <i
      className={className}
      style={size ? { width: size, height: size } : undefined}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// 이름 표기: 시안마다 하나. 한 줄 CUBE SPACE는 쓰지 않는다(between은 위에서 마크를 사이에 둔다).
function Wordmark({ lock }: { lock: Exclude<Lock, "between"> }) {
  switch (lock) {
    case "stack":
      return (
        <span className="wm stack">
          <b>CUBE</b>
          <b>SPACE</b>
        </span>
      );
    case "lw":
      return (
        <span className="wm lw">
          <b>cube</b>space
        </span>
      );
    case "cubed":
      return (
        <span className="wm cubed">
          space<sup>3</sup>
        </span>
      );
    case "ko":
      return (
        <span className="wm ko">
          <b>큐브스페이스</b>
          <small>CUBE SPACE</small>
        </span>
      );
    case "mono":
      return (
        <span className="wm mono">
          cube<i>/</i>space<span className="cur">_</span>
        </span>
      );
    case "just":
      return (
        <span className="wm just">
          <b>CUBE</b>
          <span>
            {[..."SPACE"].map((c, i) => (
              <i key={i}>{c}</i>
            ))}
          </span>
        </span>
      );
    case "grot":
      return (
        <span className="wm grot">
          <b>Cube</b>
          <span>Space</span>
        </span>
      );
    case "self":
      return <span className="wm self">마크 자체가 이름</span>;
  }
}
