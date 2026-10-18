import type { Snapshot } from "@cubespace/protocol";
import { CodeChip } from "../components/CodeChip";
import { Drawer } from "../components/Drawer";
import { Rows } from "../components/Rows";
import { noticeText } from "../model/status";

type Props = { snapshot: Snapshot; open: boolean; onClose: () => void };

// 알림 서랍: 알림 종을 누르면 연다. 알림 목록만 보여 준다.
export function NoticeDrawer({ snapshot: s, open, onClose }: Props) {
  return (
    <Drawer open={open} onClose={onClose} title="알림">
      <section>
        <h3>
          알림 <span className="num">{s.notices.length}건</span>
        </h3>
        <Rows
          items={
            s.notices.length
              ? s.notices.map((n, i) => ({
                  key: String(i),
                  lead: <CodeChip code={n.code} />,
                  title: noticeText(n, s.cubes),
                }))
              : [{ key: "none", title: "없음" }]
          }
        />
      </section>
    </Drawer>
  );
}
