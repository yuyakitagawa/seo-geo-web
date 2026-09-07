import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code のワークツリー（.gitignore 済み）。リポジトリの複製なので二重に検査しない
    ".claude/**",
    // scripts/verify-api.ts の出力（.gitignore 済み）
    ".api-verify/**",
  ]),
]);

export default eslintConfig;
