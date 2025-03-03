import { promises as fsp } from "node:fs";
import { dirname, resolve } from "pathe";
import { parseJSONC, parseJSON, stringifyJSON } from "confbox";

import type { ResolveOptions, ReadOptions } from "../resolve/types";
import type { PackageJson } from "./types";
import { findNearestFile, findFarthestFile } from "../resolve/utils";
import { _resolvePath } from "../resolve/internal";

const lockFiles = [
  "yarn.lock",
  "package-lock.json",
  "pnpm-lock.yaml",
  "npm-shrinkwrap.json",
  "bun.lockb",
  "bun.lock",
];

const workspaceFiles = [
  "pnpm-workspace.yaml",
  "lerna.json",
  "turbo.json",
  "rush.json",
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

/**
 * Detects the workspace directory based on common project markers (`.git`, lockfiles, `package.json`).
 * Throws an error if the workspace root cannot be detected.
 * @param id - The base path to search, defaults to the current working directory.
 * @param options - Options to modify the search behaviour. See {@link ResolveOptions}.
 * @returns a promise resolving to the path of the detected workspace directory.
 */
export async function findWorkspaceDir(
  id: string = process.cwd(),
  options: ResolveOptions = {},
): Promise<string> {
  // Resolve the starting path
  const startingFrom = _resolvePath(id, options);
  options = { startingFrom, ...options } as ResolveOptions;

  // Lookdown for known workspace files
  try {
    const r = await findFarthestFile(workspaceFiles, options);
    return dirname(r);
  } catch {
    // Ignore
  }

  // Lookdown for .git/config
  try {
    const r = await findFarthestFile(".git/config", options);
    return resolve(r, "../..");
  } catch {
    // Ignore
  }

  // Lookdown for lockfile
  try {
    const r = await findFarthestFile(lockFiles, options);
    return dirname(r);
  } catch {
    // Ignore
  }

  // Lookup for package.json
  try {
    const r = await findNearestFile("package.json", options);
    return dirname(r);
  } catch {
    // Ignore
  }

  throw new Error("Cannot detect workspace root from " + id);
}
