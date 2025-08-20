import { promises as fsp } from "node:fs";
import { parseJSONC, stringifyJSONC } from "confbox";

import type { ResolveOptions, ReadOptions } from "../resolve/types";
import type { TSConfig } from "./types";

import { findNearestFile } from "../resolve/utils";
import { _resolvePath } from "../resolve/internal";

const FileCache = /* #__PURE__ */ new Map<string, Record<string, any>>();

/**
 * Defines a TSConfig structure.
 * @param tsconfig - The contents of `tsconfig.json` as an object. See {@link TSConfig}.
 * @returns the same `tsconfig.json` object.
 */
export function defineTSConfig(tsconfig: TSConfig): TSConfig {
  return tsconfig;
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
