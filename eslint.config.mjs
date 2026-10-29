import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // v0.1 uses explicit fetch-on-mount effects in supported client views.
  // Keep the stronger purity/static-component rules enabled; this one is
  // intentionally deferred until those views migrate to server/query loading.
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Explicitly experimental/non-v0.1 product surfaces. They still compile,
    // but do not block the supported Community Preview lint gate.
    "src/app/(dashboard)/appsec/**",
    "src/app/(dashboard)/incidents/**",
    "src/app/(dashboard)/exercises/**",
    "src/app/(dashboard)/intelligence/**",
    "src/app/(dashboard)/strategy/**",
    "src/components/intelligence/**",
    "src/components/exercises/**",
    "src/components/war-room/**",
    "src/components/ia/**",
    "src/components/strategy/**",
    "src/lib/intelligence/**",
    "src/lib/exercises/**",
    "src/lib/kpi-engine/**",
  ]),
]);

export default eslintConfig;
