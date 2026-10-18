import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import type { CubeSpaceApi } from "@cubespace/protocol";
import type { Snapshot } from "@cubespace/protocol";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Spinner } from "../components/Spinner";
import { ChainPill } from "../cube/ChainPill";
import { useSnapshot } from "../hooks/useSnapshot";
import { homeView } from "../model/home";
import { AppShell } from "./AppShell";
import { NAV } from "./nav";
import { RailButton } from "./RailButton";
import { NoticeDrawer } from "./NoticeDrawer";

// 화면(Outlet)이 받는 것: 상태 한 장 · 조작 API · 메뉴의 연결 점에 올린 슬롯(홈이 그 큐브를 띄운다)
export type LayoutContext = {
  snapshot: Snapshot;
  api: CubeSpaceApi;
  hot: number | null;
};

// 앱 틀에 주 메뉴를 경로와 묶는다. 메뉴 아래에 연결 체인(표시) · 알림 종(알림 서랍).
export function AppLayout({ api }: { api: CubeSpaceApi }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { snapshot, error } = useSnapshot(api);
  const [hot, setHot] = useState<number | null>(null);
  const [drawer, setDrawer] = useState(false);
  return (
    <AppShell
      items={NAV}
      current={NAV.findIndex((n) => n.path === pathname)}
      onSelect={(i) => navigate(NAV[i]!.path)}
      railBottom={
        snapshot && (
          <>
            <ChainPill
              vertical
              padUp={snapshot.pad.session === "up"}
              slots={homeView(snapshot).chain}
              onSlot={(slot) => navigate(`/home?cube=${slot}`)}
              onHot={setHot}
            />
            <RailButton
              label="알림"
              badge={snapshot.notices.length}
              onClick={() => setDrawer(true)}
            >
              <Icon name="bell" size={22} />
            </RailButton>
          </>
        )
      }
    >
      {snapshot ? (
        <Outlet context={{ snapshot, api, hot } satisfies LayoutContext} />
      ) : error ? (
        <p role="alert">상태를 받지 못했습니다: {error}</p>
      ) : (
        <Spinner />
      )}
      {snapshot && (
        <NoticeDrawer
          snapshot={snapshot}
          open={drawer}
          onClose={() => setDrawer(false)}
        />
      )}
      {/* 디버그용: 템플릿 카탈로그로 가는 버튼. 배포 빌드에서는 빠진다. */}
      {import.meta.env.DEV && (
        <Button
          size="sm"
          style={{ position: "fixed", right: 16, bottom: 16, zIndex: 50 }}
          onClick={() => navigate("/template")}
        >
          템플릿 보기
        </Button>
      )}
    </AppShell>
  );
}
