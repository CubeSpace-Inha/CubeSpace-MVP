import type { CubeSpaceApi, Slot, Snapshot } from "@cubespace/protocol";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { usePairing } from "../hooks/usePairing";
import { freeSlot, PAIR_STEPS, pairStep, placeText, regPixels, SLOTS } from "../model/settings";
import { LedMatrix } from "./LedMatrix";
import "./PairPanel.css";

type Props = { s: Snapshot; api: CubeSpaceApi; onRegistered: (slot: Slot) => void };

// 장치 추가 흐름(시안 #devCard): 단계 막대 · 슬롯 6칸(또는 올리기 · 완료 안내) · 큰 버튼. 설정 · 페어링 화면이 같이 쓴다.
export function PairPanel({ s, api, onRegistered }: Props) {
  const pair = usePairing(s, api, onRegistered);
  const padUp = s.pad.session === "up";
  const slot = freeSlot(s);
  const step = pairStep(s, pair.phase);

  const body = {
    place: s.pairing && (
      <div className="pairmsg">
        <span className="hico warn">
          <Icon name="warn" size={26} stroke={2.2} />
        </span>
        <div>
          <b>{placeText(s.pairing)}</b>
          <small>확인점은 패드 가운데예요</small>
        </div>
      </div>
    ),
    done: (
      <div className="pairmsg">
        <span className="hico">
          <Icon name="ok" size={26} stroke={2.4} />
        </span>
        <div>
          <b>{`큐브 ${s.pairing?.total ?? 0}개 등록 완료`}</b>
          <small>이제 패드에서 사용할 수 있어요</small>
        </div>
      </div>
    ),
    none: (
      <div className="pairmsg">
        <span className="hico warn">
          <Icon name="warn" size={26} stroke={2.2} />
        </span>
        <div>
          <b>찾은 큐브가 없어요</b>
          <small>등록할 큐브를 켜 주세요</small>
        </div>
      </div>
    ),
    idle: (
      <div className="sockets">
        {SLOTS.map((i) => {
          const c = s.cubes.find((k) => k.slot === i);
          return c ? (
            <div key={i} className="sock on" title={`슬롯 ${i} · 큐브 ${c.name}`}>
              <LedMatrix pixels={regPixels(c.icon)} />
            </div>
          ) : (
            <div key={i} className="sock vac" title={`슬롯 ${i} · 비어 있음`}>
              +
            </div>
          );
        })}
      </div>
    ),
  }[pair.phase];

  const startButton = (
    <Button variant="primary" wide disabled={slot === undefined || !padUp} onClick={pair.start}>
      {!padUp
        ? "패드를 먼저 연결해 주세요"
        : slot === undefined
          ? "슬롯 6개가 모두 찼어요 · 아래에서 등록을 해제하세요"
          : "큐브 등록 시작"}
    </Button>
  );
  const button = {
    idle: startButton,
    none: startButton,
    place: (
      <Button variant="primary" wide onClick={pair.stop}>
        그만하기
      </Button>
    ),
    done: (
      <Button variant="primary" wide disabled>
        등록 완료
      </Button>
    ),
  }[pair.phase];

  return (
    <>
      <div className="steps3">
        {PAIR_STEPS.map((n, k) => (
          <span key={n} className={k < step ? "on" : ""} />
        ))}
      </div>
      <div className="stlabel">
        {PAIR_STEPS.map((n, k) => (
          <span key={n} className={k < step ? "on" : ""}>
            {n}
          </span>
        ))}
      </div>
      {body}
      {button}
    </>
  );
}
