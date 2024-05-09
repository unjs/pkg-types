import { promises as fsp } from "node:fs";
import { dirname, resolve, isAbsolute } from "pathe";
import { ResolveOptions as _ResolveOptions, resolvePath } from "mlly";
import { findFile, FindFileOptions, findNearestFile } from "./utils";
import type { PackageJson, TSConfig } from "./types";
import { parseJSONC, parseJSON, stringifyJSON, stringifyJSONC } from "confbox";

export * from "./types";
export * from "./utils";

/**
 * Represents the options for resolving paths with additional file finding capabilities.
 */
export type ResolveOptions = _ResolveOptions & FindFileOptions;

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
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, options);
  return findNearestFile("package.json", {
    startingFrom: resolvedPath,
    ...options,
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
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, options);
  return findNearestFile("tsconfig.json", {
    startingFrom: resolvedPath,
    ...options,
  });
}

const lockFiles = [
  "yarn.lock",
  "package-lock.json",
  "pnpm-lock.yaml",
  "npm-shrinkwrap.json",
  "bun.lockb",
];

/**
 * Resolves the path to the nearest `lockfiles` from a given directory.
 * @param id - The base path for the search, defaults to the current working directory.
 * @param options - Options to modify the search behaviour. See {@link ResolveOptions}.
 * @returns A promise resolving to the path of the nearest `lockfiles`.
 */
export async function resolveLockfile(
  id: string = process.cwd(),
  options: ResolveOptions = {},
): Promise<string> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, options);
  const _options = { startingFrom: resolvedPath, ...options };

  try {
    return await findNearestFile(lockFiles, _options);
  } catch {
    // Ignore
  }

  throw new Error("No lockfile found from " + id);
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
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, options);
  const _options = { startingFrom: resolvedPath, ...options };

  // Lookup for .git/config
  try {
    const r = await findNearestFile(".git/config", _options);
    return resolve(r, "../..");
  } catch {
    // Ignore
  }

  // Lookdown for lockfile
  try {
    const r = await resolveLockfile(resolvedPath, {
      ..._options,
      reverse: false,
    });
    return dirname(r);
  } catch {
    // Ignore
  }

  // Lookdown for package.json
  try {
    const r = await findFile(resolvedPath, _options);
    return dirname(r);
  } catch {
    // Ignore
  }

  throw new Error("Cannot detect workspace root from " + id);
}
