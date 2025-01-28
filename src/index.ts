import { promises as fsp } from "node:fs";
import { dirname, resolve, isAbsolute } from "pathe";
import { type ResolveOptions as _ResolveOptions, resolvePath } from "mlly";
import { findFile, type FindFileOptions, findNearestFile, existsFile } from "./utils";
import type { PackageJson, TSConfig } from "./types";
import { parseJSONC, parseJSON, stringifyJSON, stringifyJSONC, parseYAML } from "confbox";
import { glob } from "tinyglobby"
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
    return cache.get(resolvedPath) as PackageJson;
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
    return cache.get(resolvedPath) as TSConfig;
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
      reverse: true,
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

export type PackageWorkspaceTypes = "npm" | "yarn" | "pnpm" | "lerna";

const workspaceConfigFiles = [
  {
    type: "pnpm",
    detect: "pnpm-lock.yaml",
    config: "pnpm-workspace.yaml",
  },
  {
    type: "lerna",
    detect: "lerna.json",
    config: "lerna.json",
  },
  {
    type: "yarn",
    detect: "yarn.lock",
    config: "package.json",
  },
  {
    type: "npm",
    config: "package.json",
  },
] as const;

export async function resolveWorkspace(
  id: string = process.cwd(),
  options: ResolveOptions = {}
): Promise<{
  root: string;
  type: PackageWorkspaceTypes;
  workspaces: string[];
}> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, options);

  for (const item of workspaceConfigFiles) {
    const configFilePath = await findNearestFile(item.config, {
      startingFrom: resolvedPath,
      test: (filePath) => {
        const dir = dirname(filePath);
        if ("detect" in item) {
          const detectPath = resolve(dir, item.detect);
          if (!existsFile(detectPath)) {
            return false;
          }
        }

        const configPath = resolve(dir, item.config);
        return existsFile(configPath);
      },
      ...options,
    }).catch(() => undefined);

    if (!configFilePath) {
      continue;
    }

    const rootDir = dirname(configFilePath);
    const configString = await fsp.readFile(configFilePath, "utf8");

    switch (item.type) {
      case "pnpm": {
        const content = parseYAML(configString) as any;
        return {
          type: item.type,
          root: rootDir,
          workspaces: content.packages,
        };
      }
      case "lerna": {
        const content = JSON.parse(configString);
        if (content.useWorkspaces === true) {
          // If lerna set `useWorkspaces`, fallback to yarn or npm
          continue;
        }
        return {
          type: item.type,
          root: rootDir,
          workspaces: content.packages || ["packages/*"], // is lerna default workspaces
        };
      }
      case "yarn":
      case "npm": {
        const content = JSON.parse(configString);
        if (!("workspaces" in content)) {
          continue;
        }

        const workspaces = Array.isArray(content.workspaces)
          ? content.workspaces
          : content.workspaces.packages;

        if (!Array.isArray(workspaces)) {
          continue;
        }

        return {
          type: item.type,
          root: rootDir,
          workspaces,
        };
      }
    }
  }

  throw new Error(`Cannot dected workspace from ${id}`);
}

export async function resolveWorkspacePkgs(
  id: string | Awaited<ReturnType<typeof resolveWorkspace>>,
  options: ResolveOptions = {}
): Promise<{
  type: PackageWorkspaceTypes;
  root: {
    dir: string;
    packageJson: PackageJson;
  };
  packages: {
    dir: string;
    packageJson: PackageJson;
  }[];
}> {
  const config =
    typeof id === "string" ? await resolveWorkspace(id, options) : id;
  const pkgDirs: string[] = await glob(config.workspaces, {
    cwd: config.root,
    onlyDirectories: true,
    expandDirectories: false,
    ignore: ["**/node_modules"],
  });
  const pkgAbsoluteDirs = pkgDirs.map((p) => resolve(config.root, p)).sort();

  return {
    type: config.type,
    root: {
      dir: config.root,
      packageJson: await readPackageJSON(config.root, options),
    },
    packages: await Promise.all(
      pkgAbsoluteDirs.map(async (dir) => ({
        dir,
        packageJson: await readPackageJSON(dir, options),
      }))
    ),
  };
}

export async function resolveWorkspacePkgsGraph(
  id:
    | string
    | Awaited<ReturnType<typeof resolveWorkspace>>
    | Awaited<ReturnType<typeof resolveWorkspacePkgs>>,
  options: ResolveOptions = {}
): Promise<string[][]> {
  const resolvedPkgs =
    typeof id === "object" && "packages" in id
      ? id
      : await resolveWorkspacePkgs(id, options);

  const pkgGraph = {} as any;
  for (const pkg of resolvedPkgs.packages) {
    const { name, dependencies, devDependencies } = pkg.packageJson;
    if (!name) {
      continue;
    }

    pkgGraph[name] = {
      dependencies: [
        ...Object.keys(dependencies ?? {}),
        ...Object.keys(devDependencies ?? {}),
      ],
    };
  }

  return pkgGraph;
}
