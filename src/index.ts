import { promises as fsp } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, isAbsolute } from "pathe";
import {
  type FindFileOptions,
  findNearestFile,
  findFarthestFile,
} from "./utils";
import type { PackageJson, TSConfig } from "./types";
import { parseJSONC, parseJSON, stringifyJSON, stringifyJSONC } from "confbox";

export * from "./types";
export * from "./utils";

/**
 * Represents the options for resolving paths with additional file finding capabilities.
 */
export type ResolveOptions = Omit<FindFileOptions, "startingFrom"> & {
  /** @deprecated: use parent */ url?: string;
  parent?: string;
};

/**
 * Options for reading files with optional caching.
 */
export type ReadOptions = {
  /**
   * Specifies whether the read results should be cached.
   * Can be a boolean or a map to hold the cached data.
   */
  cache?: boolean | Map<string, Record<string, any>>;
};

/**
 * Defines a PackageJson structure.
 * @param package_ - The `package.json` content as an object. See {@link PackageJson}.
 * @returns the same `package.json` object.
 */
export function definePackageJSON(package_: PackageJson): PackageJson {
  return package_;
}

/**
 * Defines a TSConfig structure.
 * @param tsconfig - The contents of `tsconfig.json` as an object. See {@link TSConfig}.
 * @returns the same `tsconfig.json` object.
 */
export function defineTSConfig(tsconfig: TSConfig): TSConfig {
  return tsconfig;
}

const FileCache = new Map<string, Record<string, any>>();

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
 * @param package_ - The `package.json` object to write. See {@link PackageJson}.
 */
export async function writePackageJSON(
  path: string,
  package_: PackageJson,
): Promise<void> {
  await fsp.writeFile(path, stringifyJSON(package_));
}

/**
 * Asynchronously reads a `tsconfig.json` file.
 * @param id - The path to the `tsconfig.json` file, defaults to the current working directory.
 * @param options - The options for resolving and reading the file. See {@link ResolveOptions}.
 * @returns a promise resolving to the parsed `tsconfig.json` object.
 */
export async function readTSConfig(
  id?: string,
  options: ResolveOptions & ReadOptions = {},
): Promise<TSConfig> {
  const resolvedPath = await resolveTSConfig(id, options);
  const cache =
    options.cache && typeof options.cache !== "boolean"
      ? options.cache
      : FileCache;
  if (options.cache && cache.has(resolvedPath)) {
    return cache.get(resolvedPath)!;
  }
  const text = await fsp.readFile(resolvedPath, "utf8");
  const parsed = parseJSONC(text) as TSConfig;
  cache.set(resolvedPath, parsed);
  return parsed;
}

/**
 * Asynchronously writes data to a `tsconfig.json` file.
 * @param path - The path to the file where the `tsconfig.json` is written.
 * @param tsconfig - The `tsconfig.json` object to write. See {@link TSConfig}.
 */
export async function writeTSConfig(
  path: string,
  tsconfig: TSConfig,
): Promise<void> {
  await fsp.writeFile(path, stringifyJSONC(tsconfig));
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
 * Resolves the path to the nearest `tsconfig.json` file from a given directory.
 * @param id - The base path for the search, defaults to the current working directory.
 * @param options - Options to modify the search behaviour. See {@link ResolveOptions}.
 * @returns A promise resolving to the path of the nearest `tsconfig.json` file.
 */
export async function resolveTSConfig(
  id: string = process.cwd(),
  options: ResolveOptions = {},
): Promise<string> {
  return findNearestFile("tsconfig.json", {
    ...options,
    startingFrom: _resolvePath(id, options),
  });
}

const lockFiles = [
  "yarn.lock",
  "package-lock.json",
  "pnpm-lock.yaml",
  "npm-shrinkwrap.json",
  "bun.lockb",
  "bun.lock",
];

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

// --- internal ---

function _resolvePath(id: string, opts: ResolveOptions = {}) {
  if (isAbsolute(id)) {
    return id;
  }
  try {
    // TODO: Support import.meta.main when available to prefer over cwd()
    // https://github.com/nodejs/node/issues/49440
    const resolved = import.meta.resolve(
      id,
      opts.parent || opts.url || process.cwd(),
    );
    if (resolved && typeof resolved === "string") {
      return fileURLToPath(resolved);
    }
  } catch {
    // Ignore
  }
  return id;
}
