import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import { App } from "./App";
import type { CubeSpaceApi } from "@cubespace/protocol";

declare global {
  interface Window {
    cubeSpace?: CubeSpaceApi; // preload/index.ts
  }
}

// preload가 연 core 연결을 쓴다
const bridge = window.cubeSpace;
if (!bridge) throw new Error("Electron에서만 실행돼요(window.cubeSpace 없음)");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App api={bridge} />
    </BrowserRouter>
  </StrictMode>,
);
