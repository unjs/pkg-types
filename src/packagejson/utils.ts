import { promises as fsp } from "node:fs";
import { dirname, resolve } from "pathe";
import { parseJSONC, parseJSON, stringifyJSON } from "confbox";

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
];

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
  packageJson: (opts) => findFile("package.json", opts).then((r) => dirname(r)),
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

export type PackageJsonDependencyType = "dev" | "optional" | "peer" | "prod" | "optionalPeer";
const dependencyTypes: Record<PackageJsonDependencyType, keyof PackageJson> = {
  dev: "devDependencies",
  optional: "optionalDependencies",
  peer: "peerDependencies",
  prod: "dependencies",
  optionalPeer: "peerDependencies",
};
const dependencyFieldToType = Object.fromEntries(
  Object.entries(dependencyTypes).map(([type, field]) => [field, type])
) as Record<keyof PackageJson, PackageJsonDependencyType>;

export function addPackageJSONDependency(
  pkg: PackageJson,
  name: string,
  version: string,
  type?: PackageJsonDependencyType
): void {
  const collectionName = dependencyTypes[type ?? 'prod'];
  const collection = pkg[collectionName] || {};
  collection[name] = version;
  const sorted = Object.fromEntries(
    Object.entries(collection).sort(([a], [b]) => a.localeCompare(b))
  );

  if (type === 'optionalPeer') {
    const peerMeta = pkg.peerDependenciesMeta || {};
    peerMeta[name] = {optional: true};
    pkg.peerDependenciesMeta = peerMeta;
  }

  pkg[collectionName] = sorted;
}

export function removePackageJSONDependency(
  pkg: PackageJson,
  name: string,
  type?: PackageJsonDependencyType
): void {
  const collectionName = dependencyTypes[type ?? 'prod'];
  const collection = pkg[collectionName];

  if ((type === 'peer' || type === 'optionalPeer') && pkg.peerDependenciesMeta && (name in pkg.peerDependenciesMeta)) {
    const peerMeta = pkg.peerDependenciesMeta;
    delete peerMeta[name];
    if (Object.keys(peerMeta).length === 0) {
      delete pkg.peerDependenciesMeta;
    }
  }

  if (!collection || !(name in collection)) {
    return;
  }

  delete collection[name];
  if (Object.keys(collection).length === 0) {
    delete pkg[collectionName];
  }
}

function getOptionalPeerDependencies(pkg: PackageJson): Map<string, boolean> {
  const result = new Map<string, boolean>();

  if (!pkg.peerDependenciesMeta || typeof pkg.peerDependenciesMeta !== 'object' || pkg.peerDependenciesMeta === null) {
    return result;
  }

  for (const [key, value] of Object.entries(pkg.peerDependenciesMeta)) {
    if (typeof value === 'object' && value !== null) {
      result.set(key, (value as {optional?: boolean}).optional === true);
    }
  }
  return result;
}

export async function updatePackageJSON(
  path: string,
  update: PackageJson,
  options: ResolveOptions & ReadOptions = {},
): Promise<void> {
  const pkg = await readPackageJSON(path, options);
  const pkgOptionalPeers = getOptionalPeerDependencies(pkg);
  const updateOptionalPeers = getOptionalPeerDependencies(update);

  for (const [key, value] of Object.entries(update)) {
    if (Object.hasOwn(dependencyFieldToType, key)) {
      let dependencyType: PackageJsonDependencyType;
      if (key === 'peerDependencies') {
        if (updateOptionalPeers.has(key)) {
          dependencyType = updateOptionalPeers.get(key) === true ? 'optionalPeer' : 'peer';
        } else {
          dependencyType = pkgOptionalPeers.get(key) === true ? 'optionalPeer' : 'peer';
        }
      } else {
        dependencyType = dependencyFieldToType[key];
      }
      for (const [depName, depVersion] of Object.entries(value)) {
        if (depVersion === undefined) {
          removePackageJSONDependency(pkg, depName, dependencyType);
        } else {
          addPackageJSONDependency(pkg, depName, dependencyType);
        }
      }
    } else {
      if (value === undefined) {
        delete pkg[key];
      } else {
        pkg[key] = value;
      }
    }
  }

  await writePackageJSON(path, pkg);
}
