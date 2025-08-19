import { promises as fsp } from "node:fs";
import { dirname, resolve } from "pathe";
import {
  parseJSONC,
  parseJSON,
  stringifyJSON,
  parseJSON5,
  stringifyJSON5,
  parseYAML,
  stringifyYAML,
} from "confbox";

import type {
  ResolveOptions,
  ReadOptions,
  FindFileOptions,
} from "../resolve/types";
import type { PackageJson } from "./types";
import { findNearestFile, findFile } from "../resolve/utils";
import { _resolvePath } from "../resolve/internal";

const lockFiles = [
  "yarn.lock",
  "package-lock.json",
  "pnpm-lock.yaml",
  "npm-shrinkwrap.json",
  "bun.lockb",
  "bun.lock",
  "deno.lock",
];

const packageFiles = ["package.json", "package.json5", "package.yaml"];

const workspaceFiles = [
  "pnpm-workspace.yaml",
  "lerna.json",
  "turbo.json",
  "rush.json",
  "deno.json",
  "deno.jsonc",
];

const FileCache = /* #__PURE__ */ new Map<string, Record<string, any>>();

/**
 * Defines a PackageJson structure.
 * @param pkg - The `package.json` content as an object. See {@link PackageJson}.
 * @returns the same `package.json` object.
 */
export function definePackageJSON(pkg: PackageJson): PackageJson {
  return pkg;
}

/**
 * Finds the nearest package file (package.json, package.json5, or package.yaml).
 * @param id - The base path for the search, defaults to the current working directory.
 * @param options - Options to modify the search behaviour. See {@link ResolveOptions}.
 * @returns A promise resolving to the path of the nearest package file.
 */
export async function findPackage(
  id: string = process.cwd(),
  options: ResolveOptions = {},
): Promise<string> {
  return findNearestFile(packageFiles, {
    ...options,
    startingFrom: _resolvePath(id, options),
  });
}

/**
 * Reads any package file format (package.json, package.json5, or package.yaml).
 * @param id - The path identifier for the package file, defaults to the current working directory.
 * @param options - The options for resolving and reading the file. See {@link ResolveOptions}.
 * @returns a promise resolving to the parsed `package.json` object.
 */
export async function readPackage(
  id?: string,
  options: ResolveOptions & ReadOptions = {},
): Promise<PackageJson> {
  const resolvedPath = await findPackage(id, options);
  const cache =
    options.cache && typeof options.cache !== "boolean"
      ? options.cache
      : FileCache;
  if (options.cache && cache.has(resolvedPath)) {
    return cache.get(resolvedPath)!;
  }
  const blob = await fsp.readFile(resolvedPath, "utf8");
  let parsed: PackageJson;

  if (resolvedPath.endsWith(".json5")) {
    parsed = parseJSON5(blob) as PackageJson;
  } else if (resolvedPath.endsWith(".yaml")) {
    parsed = parseYAML(blob) as PackageJson;
  } else {
    try {
      parsed = parseJSON(blob) as PackageJson;
    } catch {
      parsed = parseJSONC(blob) as PackageJson;
    }
  }

  cache.set(resolvedPath, parsed);
  return parsed;
}

/**
 * Writes data to a package file with format detection based on file extension.
 * @param path - The path to the file where the package data is written.
 * @param pkg - The package object to write. See {@link PackageJson}.
 */
export async function writePackage(
  path: string,
  pkg: PackageJson,
): Promise<void> {
  let content: string;

  if (path.endsWith(".json5")) {
    content = stringifyJSON5(pkg);
  } else if (path.endsWith(".yaml")) {
    content = stringifyYAML(pkg);
  } else {
    content = stringifyJSON(pkg);
  }

  await fsp.writeFile(path, content);
}

/**
 * Asynchronously reads a `package.json` file.
 * @param id - The path identifier for the package.json, defaults to the current working directory.
 * @param options - The options for resolving and reading the file. See {@link ResolveOptions}.
 * @returns a promise resolving to the parsed `package.json` object.
 */
export async function readPackageJSON(
  id?: string,
  options: ResolveOptions & ReadOptions = {},
): Promise<PackageJson> {
  const resolvedPath = await resolvePackageJSON(id, options);
  const cache =
    options.cache && typeof options.cache !== "boolean"
      ? options.cache
      : FileCache;
  if (options.cache && cache.has(resolvedPath)) {
    return cache.get(resolvedPath)!;
  }
  const blob = await fsp.readFile(resolvedPath, "utf8");
  let parsed: PackageJson;
  try {
    parsed = parseJSON(blob) as PackageJson;
  } catch {
    parsed = parseJSONC(blob) as PackageJson;
  }
  cache.set(resolvedPath, parsed);
  return parsed;
}

/**
 * Asynchronously writes data to a `package.json` file.
 * @param path - The path to the file where the `package.json` is written.
 * @param pkg - The `package.json` object to write. See {@link PackageJson}.
 */
export async function writePackageJSON(
  path: string,
  pkg: PackageJson,
): Promise<void> {
  await fsp.writeFile(path, stringifyJSON(pkg));
}

/**
 * Resolves the path to the nearest `package.json` file from a given directory.
 * @param id - The base path for the search, defaults to the current working directory.
 * @param options - Options to modify the search behaviour. See {@link ResolveOptions}.
 * @returns A promise resolving to the path of the nearest `package.json` file.
 */
export async function resolvePackageJSON(
  id: string = process.cwd(),
  options: ResolveOptions = {},
): Promise<string> {
  return findNearestFile("package.json", {
    ...options,
    startingFrom: _resolvePath(id, options),
  });
}

/**
 * Resolves the path to the nearest lockfile from a given directory.
 * @param id - The base path for the search, defaults to the current working directory.
 * @param options - Options to modify the search behaviour. See {@link ResolveOptions}.
 * @returns A promise resolving to the path of the nearest lockfile.
 */
export async function resolveLockfile(
  id: string = process.cwd(),
  options: ResolveOptions = {},
): Promise<string> {
  return findNearestFile(lockFiles, {
    ...options,
    startingFrom: _resolvePath(id, options),
  });
}

type WorkspaceTestName =
  | "workspaceFile"
  | "gitConfig"
  | "lockFile"
  | "packageJson";
type WorkspaceTestFn = (opts: FindFileOptions) => Promise<string>;

const workspaceTests: Record<WorkspaceTestName, WorkspaceTestFn> = {
  workspaceFile: (opts) =>
    findFile(workspaceFiles, opts).then((r) => dirname(r)),
  gitConfig: (opts) =>
    findFile(".git/config", opts).then((r) => resolve(r, "../..")),
  lockFile: (opts) => findFile(lockFiles, opts).then((r) => dirname(r)),
  packageJson: (opts) => findFile(packageFiles, opts).then((r) => dirname(r)),
} as const;

/**
 * Detects the workspace directory based on common project markers .
 * Throws an error if the workspace root cannot be detected.
 *
 * @param id - The base path to search, defaults to the current working directory.
 * @param options - Options to modify the search behaviour. See {@link ResolveOptions}.
 * @returns a promise resolving to the path of the detected workspace directory.
 */
export async function findWorkspaceDir(
  id: string = process.cwd(),
  options: ResolveOptions &
    Partial<Record<WorkspaceTestName, boolean | "closest" | "furthest">> & {
      tests?: WorkspaceTestName[];
    } = {},
): Promise<string> {
  const startingFrom = _resolvePath(id, options);
  // prettier-ignore
  const tests: WorkspaceTestName[] = options.tests || [ "workspaceFile", "gitConfig", "lockFile", "packageJson" ];
  for (const testName of tests) {
    const test = workspaceTests[testName];
    if (options[testName] === false || !test) {
      continue;
    }
    const direction =
      options[testName] || (testName === "gitConfig" ? "closest" : "furthest");
    const detected = await test({
      ...options,
      startingFrom,
      reverse: direction === "furthest",
    }).catch(() => {});
    if (detected) {
      return detected;
    }
  }

  throw new Error(`Cannot detect workspace root from ${id}`);
}

export async function updatePackage(
  id: string,
  callback: (pkg: PackageJson) => Promise<void> | void,
  options: ResolveOptions & ReadOptions = {},
): Promise<void> {
  const resolvedPath = await findPackage(id, options);
  const pkg = await readPackage(id, options);
  const proxy = new Proxy(pkg, {
    get(target, prop) {
      if (
        typeof prop === "string" &&
        dependencyKeys.includes(prop) &&
        !Object.hasOwn(target, prop)
      ) {
        target[prop] = {};
      }
    },
  });
  await callback(proxy);
  await writePackage(resolvedPath, pkg);
}

export function sortPackage(pkg: PackageJson): PackageJson {
  const sorted: PackageJson = {};

  // Sort known keys and retain order of unknown keys
  const originalKeys = Object.keys(pkg);
  const knownKeysPresent = defaultFieldOrder.filter((key) =>
    Object.hasOwn(pkg, key),
  );
  for (const key of originalKeys) {
    const currentIndex = knownKeysPresent.indexOf(key);
    if (currentIndex === -1) {
      sorted[key] = pkg[key];
      continue;
    }
    for (let i = 0; i <= currentIndex; i++) {
      const knownKey = knownKeysPresent[i];
      if (!Object.hasOwn(sorted, knownKey)) {
        sorted[knownKey] = pkg[knownKey];
      }
    }
  }

  // Sort specific nested keys
  for (const key of [...dependencyKeys, "scripts"]) {
    const value = sorted[key];
    if (isObject(value)) {
      sorted[key] = sortObject(value);
    }
  }

  return sorted;
}

export function normalizePackage(pkg: PackageJson): PackageJson {
  // Sort the package.json fields
  const normalized: PackageJson = sortPackage(pkg);
  // Remove dependency fields if they are not an object
  for (const key of dependencyKeys) {
    if (!Object.hasOwn(normalized, key)) {
      continue;
    }
    const value = normalized[key];
    if (!isObject(value)) {
      delete normalized[key];
    }
  }
  return normalized;
}

// --- internal ---

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
  );
}

const dependencyKeys = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

const defaultFieldOrder = [
  "$schema",
  "name",
  "version",
  "private",
  "description",
  "keywords",
  "homepage",
  "bugs",
  "repository",
  "funding",
  "license",
  "author",
  "sideEffects",
  "type",
  "imports",
  "exports",
  "main",
  "module",
  "browser",
  "types",
  "typesVersions",
  "typings",
  "bin",
  "man",
  "files",
  "workspaces",
  "scripts",
  "resolutions",
  "overrides",
  "dependencies",
  "devDependencies",
  "dependenciesMeta",
  "peerDependencies",
  "peerDependenciesMeta",
  "optionalDependencies",
  "bundledDependencies",
  "bundleDependencies",
  "packageManager",
  "engines",
  "publishConfig",
];
