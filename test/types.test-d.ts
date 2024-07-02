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
        ".": [
          {
            import: "./esm/index.js",
            require: "./cjs/index.js",
          },
          "./fallback/index.js",
        ],
        "./feature": ["./features/feature.mjs", "./features/feature.js"],
      },
    },
  ]);
});
