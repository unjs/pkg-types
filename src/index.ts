import { promises as fsp } from "node:fs";
import { dirname, resolve, isAbsolute } from "pathe";
import { ResolveOptions as _ResolveOptions, resolvePath } from "mlly";
import { findFile, FindFileOptions, findNearestFile } from "./utils";
import type { PackageJson, TSConfig } from "./types";

export * from "./types";
export * from "./utils";

export type ResolveOptions = _ResolveOptions & FindFileOptions;
export type ReadOptions = {
  cache?: boolean | Map<string, Record<string, any>>;
};

export type WriteOptions = {
  indent?: number | "tab";
  eol?: "LF" | "CRLF";
  eolFinal?: boolean;
};

const EOL_CRLF = "\r\n";
const EOL_LF = "\n";

function stringifyJSON(value: any, options: WriteOptions = {}) {
  const eol = options.eol === "CRLF" ? EOL_CRLF : EOL_LF;
  const jstr = JSON.stringify(
    value,
    undefined,
    options.indent === "tab" ? "\t" : options.indent ?? 2
  );

  return (
    (eol !== EOL_LF ? jstr.replaceAll(EOL_LF, eol) : jstr) +
    (options.eolFinal ?? jstr.includes(EOL_LF) ? eol : "")
  );
}

export function definePackageJSON(package_: PackageJson): PackageJson {
  return package_;
}

export function defineTSConfig(tsconfig: TSConfig): TSConfig {
  return tsconfig;
}

const FileCache = new Map<string, Record<string, any>>();

export async function readPackageJSON(
  id?: string,
  options: ResolveOptions & ReadOptions = {}
): Promise<PackageJson> {
  const resolvedPath = await resolvePackageJSON(id, options);
  const cache =
    options.cache && typeof options.cache !== "boolean"
      ? options.cache
      : FileCache;
  if (options.cache && cache.has(resolvedPath)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return cache.get(resolvedPath)!;
  }
  const blob = await fsp.readFile(resolvedPath, "utf8");
  const parsed = JSON.parse(blob) as PackageJson;
  cache.set(resolvedPath, parsed);
  return parsed;
}

export async function writePackageJSON(
  path: string,
  package_: PackageJson,
  options?: WriteOptions
): Promise<void> {
  await fsp.writeFile(path, stringifyJSON(package_, options));
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
  tsconfig: TSConfig,
  options?: WriteOptions
): Promise<void> {
  await fsp.writeFile(path, stringifyJSON(tsconfig, options));
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
