import { assertType } from "vitest";
import type { PackageJson } from "../src";
import test from "node:test";

test("types", () => {
  assertType<PackageJson[]>([
    {},
    { name: "foo" },
    { version: "1.0.0" },
    // Partial objects
    {
      bugs: {},
      bin: {},
      dependencies: {},
      devDependencies: {},
      repository: { type: "", url: "" }, // TODO: should empty strings be allowed?
      exports: {},
      imports: {},
      typesVersions: {},
      publishConfig: {},
    },
    // Exports field
    { exports: "./index.mjs" },
    { exports: {} },
    {
      exports: {
        ".": "./index.mjs",
        "./feature": "./features/feature.mjs",
      },
    },
    {
      exports: {
        node: {
          import: "./node/index.mjs",
          require: "./node/index.js",
        },
      },
    },
    {
      exports: ["./a.mjs", "./a.d.ts"],
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
