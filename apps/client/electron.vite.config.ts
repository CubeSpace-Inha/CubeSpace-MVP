import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";

// @cubespace/protocol은 TS 원본을 내보내므로 main · preload에 같이 묶는다
const bundleProtocol = { build: { externalizeDeps: { exclude: ["@cubespace/protocol"] } } };

export default defineConfig({
  main: bundleProtocol,
  preload: bundleProtocol,
  renderer: {
    plugins: [react()],
  },
});
