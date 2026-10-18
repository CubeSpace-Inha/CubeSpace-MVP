import { Navigate, Route, Routes } from "react-router";
import type { CubeSpaceApi } from "@cubespace/protocol";
import { AppLayout } from "./layout/AppLayout";
import { AiScreen } from "./screens/AiScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { PairingScreen } from "./screens/PairingScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { WindowsScreen } from "./screens/WindowsScreen";
import { TemplatePage } from "./template/TemplatePage";

export function App({ api }: { api: CubeSpaceApi }) {
  return (
    <Routes>
      <Route path="/" element={<PairingScreen api={api} />} />
      <Route element={<AppLayout api={api} />}>
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/windows" element={<WindowsScreen />} />
        <Route path="/ai" element={<AiScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>
      {/* 개발자용 템플릿 카탈로그. 배포 빌드에서는 빠진다. */}
      {import.meta.env.DEV && (
        <Route path="/template" element={<TemplatePage />} />
      )}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
