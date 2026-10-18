import { useOutletContext } from "react-router";
import { Toast } from "../components/Toast";
import { useToast } from "../hooks/useToast";
import type { LayoutContext } from "../layout/AppLayout";
import { Board } from "../layout/Board";
import { Column } from "../layout/Column";
import { DeviceCard } from "./settings/DeviceCard";
import "./SettingsScreen.css";

// 설정(시안 pad-home.html .setv): 장치 추가 · 등록 해제만 둔다(MVP).
export function SettingsScreen() {
  const { snapshot: s, api } = useOutletContext<LayoutContext>();
  const toast = useToast();

  return (
    <Board>
      <h1 className="sr-only">설정</h1>
      <Column>
        <DeviceCard s={s} api={api} toast={toast.show} />
      </Column>
      <Toast text={toast.text} visible={toast.visible} />
    </Board>
  );
}
