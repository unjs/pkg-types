import type { ResolveOptions, ReadOptions } from "../resolve/types";
import type {
  WorkspaceConfig,
  WorkspaceGraph,
  WorkspacePackage,
} from "./types";
import { glob as fsGlob } from "node:fs";
import { promisify } from "node:util";
import { dirname, relative, resolve, join } from "pathe";
import { readPackage } from "../packagejson/utils";
import { findFile } from "../resolve/utils";
import { _resolvePath } from "../resolve/internal";
import {
  packageFiles,
  expandPatternsToPackageFiles,
  readPNPMWorkspace,
  readLernaWorkspace,
  readRushWorkspace,
  readDenoWorkspace,
  hasWorkspacesInPackageFile,
  buildWorkspaceGraph,
} from "./internal";

type GlobFunction = (
  patterns: string[],
  options?: { cwd?: string; absolute?: boolean },
) => Promise<string[]>;

const nativeGlob = fsGlob
  ? (promisify(fsGlob) as (
      pattern: string,
      options?: { cwd?: string },
    ) => Promise<string[]>)
  : undefined;

async function defaultGlob(
  patterns: string[],
  options: { cwd?: string; absolute?: boolean } = {},
): Promise<string[]> {
  if (!nativeGlob) {
    throw new Error(
      "pkg-types requires a glob implementation. Please provide options.glob or upgrade to Node.js 22+ for native fs.glob support.",
    );
  }

  const cwd = options.cwd || process.cwd();
  const results: string[] = [];

  for (const pattern of patterns) {
    try {
      const files = await nativeGlob(pattern, { cwd });

      if (options.absolute) {
        results.push(...files.map((file) => join(cwd, file)));
      } else {
        results.push(...files);
      }
    } catch {
      // Ignore
    }
  }
  return results;
}

export async function resolveWorkspace(
  id: string = process.cwd(),
  options: ResolveOptions & ReadOptions = {},
): Promise<WorkspaceConfig> {
  const startingFrom = _resolvePath(id, options);

  const pnpmPath = await findFile("pnpm-workspace.yaml", {
    startingFrom,
  }).catch(() => undefined);
  if (pnpmPath) {
    const rootDir = dirname(pnpmPath);
    const pnpm = await readPNPMWorkspace(rootDir);
    if (pnpm && pnpm.packages.length > 0) {
      return {
        type: "pnpm",
        rootDir,
        configPath: pnpm.configPath,
        packages: pnpm.packages,
        config: pnpm.config,
      };
    }
  }

  const rushPath = await findFile("rush.json", { startingFrom }).catch(
    () => undefined,
  );
  if (rushPath) {
    const rootDir = dirname(rushPath);
    const rush = await readRushWorkspace(rootDir);
    if (rush && rush.packages.length > 0) {
      return {
        type: "rush",
        rootDir,
        configPath: rush.configPath,
        packages: rush.packages,
        config: rush.config,
      };
    }
  }

  const lernaPath = await findFile("lerna.json", { startingFrom }).catch(
    () => undefined,
  );
  if (lernaPath) {
    const rootDir = dirname(lernaPath);
    const lerna = await readLernaWorkspace(rootDir);
    if (lerna && lerna.packages.length > 0) {
      return {
        type: "lerna",
        rootDir,
        configPath: lerna.configPath,
        packages: lerna.packages,
        config: lerna.config,
      };
    }
  }

  const denoPath = await findFile(["deno.json", "deno.jsonc"], {
    startingFrom,
  }).catch(() => undefined);
  if (denoPath) {
    const rootDir = dirname(denoPath);
    const deno = await readDenoWorkspace(rootDir);
    if (deno && deno.packages.length > 0) {
      return {
        type: "deno",
        rootDir,
        configPath: deno.configPath,
        packages: deno.packages,
        config: deno.config,
      };
    }
  }

  const pkgPath = await findFile(packageFiles, {
    startingFrom,
    test: hasWorkspacesInPackageFile,
  }).catch(() => undefined);

  if (pkgPath) {
    const rootDir = dirname(pkgPath);
    const pkg = await readPackage(rootDir, options);
    const workspaces = Array.isArray(pkg.workspaces)
      ? pkg.workspaces
      : Array.isArray(pkg.workspaces?.packages)
        ? pkg.workspaces!.packages || []
        : [];

    let type: WorkspaceConfig["type"] = "npm";
    if (typeof pkg.packageManager === "string") {
      if (pkg.packageManager.startsWith("bun@")) type = "bun";
      else if (pkg.packageManager.startsWith("yarn@")) type = "yarn";
      else if (pkg.packageManager.startsWith("pnpm@")) type = "pnpm";
    }

    return {
      type,
      rootDir,
      configPath: pkgPath,
      packages: workspaces,
      config: pkg,
    };
  }

  throw new Error(`Cannot resolve workspace from ${id}`);
}

/**
 * Resolves a workspace configuration and reads all workspace packages.
 * @param id - A base path or a pre-resolved workspace configuration.
 * @param options - Options to modify the search and reading behaviour. Can include custom glob function.
 * @returns a promise resolving to a sorted list of workspace packages.
 */
export async function resolveWorkspacePackages(
  id?: string | WorkspaceConfig,
  options: ResolveOptions &
    ReadOptions & {
      /**
       * Custom glob implementation. If not provided, will use Node.js 22+ native fs.glob.
       * Example: `{ glob: (patterns, opts) => import('tinyglobby').then(m => m.glob(patterns, opts)) }`
       */
      glob?: GlobFunction;
    } = {},
): Promise<WorkspacePackage[]> {
  const root = isWorkspaceConfig(id)
    ? id
    : await resolveWorkspace(id ?? process.cwd(), options);
  if (!root.packages || root.packages.length === 0) {
    return [];
  }

  const globFn = options.glob || defaultGlob;
  const patterns = expandPatternsToPackageFiles(root.packages);
  const files = await globFn(patterns, {
    cwd: root.rootDir,
    absolute: true,
  });

  const seen = new Set<string>();
  const packages: WorkspacePackage[] = [];
  for (const packageJsonPath of files) {
    const path = dirname(packageJsonPath);
    if (seen.has(path)) {
      continue;
    }
    seen.add(path);
    const packageJson = await readPackage(path, options);
    const name = packageJson.name || relative(root.rootDir, path);
    packages.push({
      name,
      path,
      relativePath: relative(root.rootDir, path),
      packageJsonPath,
      packageJson,
    });
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Resolves a workspace configuration and builds a dependency graph.
 * @param id - A base path or a pre-resolved workspace configuration.
 * @param options - Options to modify the search and reading behaviour.
 * @returns a promise resolving to a workspace graph.
 */
export async function resolveWorkspaceGraph(
  id?: string | WorkspaceConfig,
  options: ResolveOptions & ReadOptions & { glob?: GlobFunction } = {},
): Promise<WorkspaceGraph> {
  const root = isWorkspaceConfig(id)
    ? id
    : await resolveWorkspace(id ?? process.cwd(), options);
  const packages = await resolveWorkspacePackages(root, options);
  const { nodes, sorted } = buildWorkspaceGraph(packages);
  return { packages: nodes, sorted, root };
}

// --- internal ---

function isWorkspaceConfig(input: any): input is WorkspaceConfig {
  return (
    !!input &&
    typeof input === "object" &&
    typeof input.rootDir === "string" &&
    Array.isArray(input.packages)
  );
}
