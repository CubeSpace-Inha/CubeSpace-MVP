import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

// 모든 패키지가 같이 쓰는 ESLint 설정. 각 패키지의 `pnpm lint`(eslint .)가 이 파일을 찾아 쓴다.
export default tseslint.config(
  { ignores: ["**/node_modules", "**/dist", "**/out", "drivers"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Node에서 도는 코드: core · pad-sim · protocol · Electron main/preload · 설정 파일
  { languageOptions: { globals: globals.node } },
  // 브라우저에서 도는 코드: client 화면과 그 테스트
  {
    files: ["apps/client/src/renderer/**/*.{ts,tsx}", "apps/client/test/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
);
