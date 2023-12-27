import { promises as fsp } from "node:fs";
import { dirname, resolve, isAbsolute } from "pathe";
import { ResolveOptions as _ResolveOptions, resolvePath } from "mlly";
import detectIndent from "detect-indent";
import { detectNewline } from "detect-newline";
import { findFile, FindFileOptions, findNearestFile } from "./utils";
import type { PackageJsonFile, TSConfig } from "./types";

export * from "./types";
export * from "./utils";

export type ResolveOptions = _ResolveOptions & FindFileOptions;
export type ReadOptions = {
  cache?: boolean | Map<string, Record<string, any>>;
};

export function definePackageJSON(package_: PackageJsonFile): PackageJsonFile {
  return package_;
}

export function defineTSConfig(tsconfig: TSConfig): TSConfig {
  return tsconfig;
}

const FileCache = new Map<string, Record<string, any>>();

export async function readPackageJSON(
  id?: string,
  options: ResolveOptions & ReadOptions = {}
): Promise<PackageJsonFile & PackageJsonFile> {
  const resolvedPath = await resolvePackageJSON(id, options);
  const cache =
    options.cache && typeof options.cache !== "boolean"
      ? options.cache
      : FileCache;
  if (options.cache && cache.has(resolvedPath)) {
    return cache.get(resolvedPath)! as PackageJsonFile & PackageJsonFile;
  }
  const blob = await fsp.readFile(resolvedPath, "utf8");
  const meta = {
    indent: detectIndent(blob).indent,
    newline: detectNewline(blob),
  };
  const parsed = JSON.parse(blob) as PackageJsonFile;
  const file = { ...parsed, ...meta };
  cache.set(resolvedPath, file);
  return file;
}

export async function writePackageJSON(
  path: string,
  package_: PackageJsonFile & PackageJsonFile
): Promise<void> {
  const { indent, newline, ...data } = package_;
  let json = JSON.stringify(data, undefined, indent);
  if (newline) {
    json += newline;
  }
  await fsp.writeFile(path, json);
}

export async function readTSConfig(
  id?: string,
  options: ResolveOptions & ReadOptions = {}
): Promise<TSConfig> {
  const resolvedPath = await resolveTSConfig(id, options);
  const cache =
    options.cache && typeof options.cache !== "boolean"
      ? options.cache
      : FileCache;
  if (options.cache && cache.has(resolvedPath)) {
    return cache.get(resolvedPath)!;
  }
  const blob = await fsp.readFile(resolvedPath, "utf8");
  const jsonc = await import("jsonc-parser");
  const parsed = jsonc.parse(blob) as TSConfig;
  cache.set(resolvedPath, parsed);
  return parsed;
}

export async function writeTSConfig(
  path: string,
  tsconfig: TSConfig
): Promise<void> {
  await fsp.writeFile(path, JSON.stringify(tsconfig, undefined, 2));
}

export async function resolvePackageJSON(
  id: string = process.cwd(),
  options: ResolveOptions = {}
): Promise<string> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, options);
  return findNearestFile("package.json", {
    startingFrom: resolvedPath,
    ...options,
  });
}

export async function resolveTSConfig(
  id: string = process.cwd(),
  options: ResolveOptions = {}
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

export async function resolveLockfile(
  id: string = process.cwd(),
  options: ResolveOptions = {}
): Promise<string> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, options);
  const _options = { startingFrom: resolvedPath, ...options };
  for (const lockFile of lockFiles) {
    try {
      return await findNearestFile(lockFile, _options);
    } catch {}
  }
  throw new Error("No lockfile found from " + id);
}

export async function findWorkspaceDir(
  id: string = process.cwd(),
  options: ResolveOptions = {}
): Promise<string> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, options);
  const _options = { startingFrom: resolvedPath, ...options };

  // Lookup for .git/config
  try {
    const r = await findNearestFile(".git/config", _options);
    return resolve(r, "../..");
  } catch {}

  // Lookdown for lockfile
  try {
    const r = await resolveLockfile(resolvedPath, {
      ..._options,
      reverse: true,
    });
    return dirname(r);
  } catch {}

  // Lookdown for package.json
  try {
    const r = await findFile(resolvedPath, _options);
    return dirname(r);
  } catch {}

  throw new Error("Cannot detect workspace root from " + id);
}
