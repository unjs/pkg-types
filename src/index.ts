import { promises as fsp } from "node:fs";
import { dirname, resolve, isAbsolute } from "pathe";
import { ResolveOptions as _ResolveOptions, resolvePath } from "mlly";
import { sortPackages } from "@pnpm/sort-packages";
import {
  findFile,
  FindFileOptions,
  findNearestFile,
  existsFile,
} from "./utils";
import type { PackageJson, TSConfig } from "./types";

export * from "./types";
export * from "./utils";

export type ResolveOptions = _ResolveOptions & FindFileOptions;
export type ReadOptions = {
  cache?: boolean | Map<string, Record<string, any>>;
};

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
    return cache.get(resolvedPath) as PackageJson;
  }
  const blob = await fsp.readFile(resolvedPath, "utf8");
  const parsed = JSON.parse(blob) as PackageJson;
  cache.set(resolvedPath, parsed);
  return parsed;
}

export async function writePackageJSON(
  path: string,
  package_: PackageJson
): Promise<void> {
  await fsp.writeFile(path, JSON.stringify(package_, undefined, 2));
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
    return cache.get(resolvedPath) as TSConfig;
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
        const parseYAML = await import("yaml").then((r) => r.parse);
        const content = parseYAML(configString);
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
  const globby = await import("globby").then((r) => r.globby);
  const pkgDirs: string[] = await globby(config.workspaces, {
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

  return sortPackages(pkgGraph);
}
