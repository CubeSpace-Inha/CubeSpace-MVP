import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";

// 고급 설정 · 추천 배정: 미리보기 대화상자를 연다(시안 toolRecommend)
export function RecommendTool({ onPreview }: { onPreview: () => void }) {
  return (
    <>
      <div className="sec-t sec-row">
        <span>배정 도우미 · 지금 작업에 맞는 조합</span>
        <Badge>미리보기 후 적용</Badge>
      </div>
      <p className="muted">저장한 프로젝트와 서로 다른 역할의 에이전트로 조합을 제안해요. 기존에 연결된 큐브를 우선 사용합니다.</p>
      <div className="rcv" aria-hidden="true">
        <span>▤</span>＋<span>{"</>"}</span>＋<span>✦</span>
      </div>
      <ul className="plain">
        <li>원하는 큐브로 직접 변경 가능</li>
        <li>기존 터치 전환 후보 유지</li>
        <li>적용 후 시작은 직접 선택</li>
      </ul>
      <Button variant="primary" onClick={onPreview}>
        추천 배정 미리보기
      </Button>
      <p className="muted fb">저장한 구성의 종류와 역할을 이용한 규칙 기반 추천 예시예요.</p>
    </>
  );
}
