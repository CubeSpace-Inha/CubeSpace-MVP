import { useNavigate } from "react-router";
import type { CubeSpaceApi } from "@cubespace/protocol";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Logo } from "../components/Logo";
import { Spinner } from "../components/Spinner";
import { PairPanel } from "../cube/PairPanel";
import { useSnapshot } from "../hooks/useSnapshot";
import { PadStep } from "./pairing/PadStep";
import "./PairingScreen.css";

// 앱을 처음 켰을 때(/). 메뉴 없이 뜬다. 1. 패드 연결 → 2. 큐브 등록 → 시작. 시안이 없어 설정의 장치 추가 흐름을 가운데에 둔 임시안.
// 큐브를 하나 이상 등록하면 시작할 수 있고, 등록은 나중에 설정에서 해도 된다.
export function PairingScreen({ api }: { api: CubeSpaceApi }) {
  const navigate = useNavigate();
  const { snapshot: s, error } = useSnapshot(api);
  const home = () => navigate("/home");

  return (
    <main className="pairing">
      <h1 className="sr-only">페어링</h1>
      <Logo size={112} />
      <p className="pairing-hello">
        <b>CUBE SPACE를 시작해요</b>
        <small>패드를 연결하고 쓸 큐브를 등록해 주세요</small>
      </p>
      {s ? (
        <>
          <PadStep pad={s.pad} />
          <Card title="2. 큐브 등록" meta={<span className="num">{s.cubes.length} / 6</span>}>
            <p className="pairing-muted">등록할 큐브를 모두 켜 주세요. 패드가 연결돼야 시작할 수 있어요.</p>
            <PairPanel s={s} api={api} onRegistered={() => undefined} />
          </Card>
        </>
      ) : error ? (
        <p role="alert">상태를 받지 못했습니다: {error}</p>
      ) : (
        <Spinner />
      )}
      <div className="pairing-foot">
        <Button wide disabled={!s?.cubes.length} onClick={home}>
          {s?.cubes.length ? `큐브 ${s.cubes.length}개로 시작하기` : "큐브를 하나 이상 등록하면 시작할 수 있어요"}
        </Button>
        <button type="button" className="pairing-skip" onClick={home}>
          나중에 하기
        </button>
      </div>
    </main>
  );
}
