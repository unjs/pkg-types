import { assertType } from "vitest";
import type { PackageJson } from "../src";
import test from "node:test";

test("types", () => {
  assertType<PackageJson[]>([
    {},
    { name: "foo" },
    { version: "1.0.0" },
    { exports: "./index.mjs" },
  ]);
});
