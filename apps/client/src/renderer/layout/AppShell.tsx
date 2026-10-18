import type { ReactNode } from "react";
import { Icon } from "../components/Icon";
import { useTheme } from "../hooks/useTheme";
import { Rail, type RailItem } from "./Rail";
import { RailButton } from "./RailButton";
import "./AppShell.css";

type Props = {
  items: RailItem[];
  current: number;
  onSelect: (index: number) => void;
  railBottom?: ReactNode; // 테마 버튼 위에 놓을 것(알림 등)
  children: ReactNode;
};

// 앱 틀: 왼쪽 메뉴 + 점 무늬 보드. 테마 전환 버튼은 메뉴 맨 아래에 늘 있다.
export function AppShell({ items, current, onSelect, railBottom, children }: Props) {
  const { theme, toggle } = useTheme();
  return (
    <div className="app">
      <Rail items={items} current={current} onSelect={onSelect}>
        {railBottom}
        <RailButton label="화이트·블랙 모드 전환" onClick={toggle}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={22} />
        </RailButton>
      </Rail>
      <main className="views">{children}</main>
    </div>
  );
}
