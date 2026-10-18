import { useEffect, useState } from "react";
import type { Pad } from "@cubespace/protocol";
import { Card } from "../../components/Card";
import { Icon, type IconName } from "../../components/Icon";

const SLOW_MS = 10_000; // 이만큼 기다려도 안 붙으면 확인할 것을 보여 준다

const TODO: [IconName, string, string][] = [
  ["power", "패드 전원 켜기", "전원이 들어오면 패드 LED가 켜져요"],
  ["plug", "USB 케이블로 PC에 연결", "패드와 PC를 케이블로 바로 연결해 주세요(허브보다 PC 포트가 좋아요)"],
  ["ok", "자동으로 연결돼요", "따로 누를 것은 없어요 · 연결되면 아래에 표시돼요"],
];

// 페어링 1단계: 패드 연결. 하는 순서 · 지금 상태(찾는 중 / 연결됨) · 오래 걸리면 확인할 것.
// 연결 자체는 core가 알아서 다시 시도한다(화면은 상태만 본다).
export function PadStep({ pad }: { pad: Pad }) {
  const up = pad.session === "up";
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (up) return;
    const t = setTimeout(() => setSlow(true), SLOW_MS);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [up]);

  return (
    <Card title="1. 패드 연결" meta={up ? "연결됨" : "기다리는 중"}>
      <ol className="padsteps">
        {TODO.map(([icon, title, hint]) => (
          <li key={title}>
            <Icon name={icon} size={20} />
            <span>
              <b>{title}</b>
              <small>{hint}</small>
            </span>
          </li>
        ))}
      </ol>
      {up ? (
        <div className="pairmsg" role="status">
          <span className="hico">
            <Icon name="ok" size={26} stroke={2.4} />
          </span>
          <div>
            <b>패드 연결됨</b>
            <small>
              {pad.fw ? `펌웨어 ${pad.fw}` : "펌웨어 정보 없음"}
              {pad.badSensors.length > 0 && ` · 센서 ${pad.badSensors.join(", ")}번 확인 필요`}
            </small>
          </div>
        </div>
      ) : (
        <div className="radar" role="status">
          <i />
          <i />
          <i />
          <b />
          <small>패드를 찾는 중…</small>
        </div>
      )}
      {!up && slow && (
        <ul className="padhelp">
          <li>케이블을 뺐다가 다시 꽂거나 다른 USB 포트에 꽂아 보세요</li>
          <li>충전 전용 케이블은 데이터가 안 가요 · 데이터 케이블인지 확인해 주세요</li>
          <li>패드 전원을 껐다 켜 보세요</li>
        </ul>
      )}
    </Card>
  );
}
