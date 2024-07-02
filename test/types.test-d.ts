import { assertType } from "vitest";
import type { PackageJson } from "../src";
import test from "node:test";

test("types", () => {
  assertType<PackageJson[]>([
    {},
    { name: "foo" },
    { version: "1.0.0" },
    // Exports field
    { exports: "./index.mjs" },
    { exports: {} },
    {
      exports: {
        ".": "./index.mjs",
      },
    },
    {
      exports: {
        ".": {
          import: {
            types: "./dist/vue.d.mts",
            node: "./index.mjs",
            default: "./dist/vue.runtime.esm-bundler.js",
          },
          require: {
            types: "./dist/vue.d.ts",
            node: {
              production: "./dist/vue.cjs.prod.js",
              development: "./dist/vue.cjs.js",
              default: "./index.js",
            },
            default: "./index.js",
          },
        },
        "./server-renderer": {
          import: {
            types: "./server-renderer/index.d.mts",
            default: "./server-renderer/index.mjs",
          },
          require: {
            types: "./server-renderer/index.d.ts",
            default: "./server-renderer/index.js",
          },
        },
        "./compiler-sfc": {
          import: {
            types: "./compiler-sfc/index.d.mts",
            browser: "./compiler-sfc/index.browser.mjs",
            default: "./compiler-sfc/index.mjs",
          },
          require: {
            types: "./compiler-sfc/index.d.ts",
            browser: "./compiler-sfc/index.browser.js",
            default: "./compiler-sfc/index.js",
          },
        },
        "./jsx-runtime": {
          types: "./jsx-runtime/index.d.ts",
          import: "./jsx-runtime/index.mjs",
          require: "./jsx-runtime/index.js",
        },
        "./jsx-dev-runtime": {
          types: "./jsx-runtime/index.d.ts",
          import: "./jsx-runtime/index.mjs",
          require: "./jsx-runtime/index.js",
        },
        "./jsx": "./jsx.d.ts",
        "./dist/*": "./dist/*",
        "./package.json": "./package.json",
      },
    },
  ]);
});
