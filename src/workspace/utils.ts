import type { ResolveOptions, ReadOptions } from "../resolve/types";
import type {
  WorkspaceConfig,
  WorkspaceGraph,
  WorkspacePackage,
} from "./types";
import { promises as fsp } from "node:fs";
import { glob } from "tinyglobby";
import { dirname, join, relative } from "pathe";
import {
  findWorkspaceDir,
  findPackage,
  readPackage,
} from "../packagejson/utils";
import { findFile } from "../resolve/utils";
import { _resolvePath } from "../resolve/internal";
import {
  packageFiles,
  expandPatternsToPackageFiles,
  readPNPMWorkspace,
  hasWorkspacesInPackageFile,
  buildWorkspaceGraph,
} from "./internal";

/**
 * Reads workspace configuration from pnpm-workspace.yaml or package.* workspaces field.
 * @param id - The base path to search, defaults to the current working directory.
 * @param options - Options to modify the search and reading behaviour. See {@link ResolveOptions}.
 * @returns a promise resolving to the detected workspace configuration.
 */
export async function readWorkspaceConfig(
  id: string = process.cwd(),
  options: ResolveOptions & ReadOptions = {},
): Promise<WorkspaceConfig> {
  const rootDir = await findWorkspaceDir(id, options);

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

  const configPath = await findPackage(rootDir, options);
  const pkg = await readPackage(rootDir, options);

  const workspaces = Array.isArray(pkg.workspaces)
    ? pkg.workspaces
    : (Array.isArray(pkg.workspaces?.packages)
      ? pkg.workspaces!.packages || []
      : []);

  let type: WorkspaceConfig["type"] = "npm";
  if (
    typeof pkg.packageManager === "string" &&
    pkg.packageManager.startsWith("yarn@")
  ) {
    type = "yarn";
  } else {
    try {
      const stat = await fsp.stat(join(rootDir, "yarn.lock"));
      if (stat.isFile()) {
        type = "yarn";
      }
    } catch {
      // Ignore
    }
  }

  return {
    type,
    rootDir,
    configPath,
    packages: workspaces,
    config: pkg,
  };
}

/**
 * Reads all workspace packages for the detected workspace configuration.
 * @param id - The base path to search, defaults to the current working directory.
 * @param options - Options to modify the search and reading behaviour. See {@link ResolveOptions}.
 * @returns a promise resolving to a sorted list of workspace packages.
 */
export async function readWorkspacePackages(
  id?: string,
  options: ResolveOptions & ReadOptions = {},
): Promise<WorkspacePackage[]> {
  const root = await readWorkspaceConfig(id, options);
  if (!root.packages || root.packages.length === 0) {
    return [];
  }

  const patterns = expandPatternsToPackageFiles(root.packages);
  const files = await glob(patterns, {
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
 * Builds a dependency graph for the detected workspace, ordered so that
 * dependencies come before dependents.
 * @param id - The base path to search, defaults to the current working directory.
 * @param options - Options to modify the search and reading behaviour. See {@link ResolveOptions}.
 * @returns a promise resolving to a workspace graph.
 */
export async function readWorkspaceGraph(
  id?: string,
  options: ResolveOptions & ReadOptions = {},
): Promise<WorkspaceGraph> {
  const root = await readWorkspaceConfig(id, options);
  const packages = await readWorkspacePackages(root.rootDir, options);
  const { nodes, sorted } = buildWorkspaceGraph(packages);
  return { packages: nodes, sorted, root };
}

/**
 * Strictly resolves a workspace configuration by requiring an explicit
 * pnpm-workspace.yaml or a workspaces field in package.* at or above the given path.
 * @param id - The base path to search, defaults to the current working directory.
 * @param options - Options to modify the search behaviour. See {@link ResolveOptions}.
 * @returns a promise resolving to the workspace configuration.
 */
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

  const pkgPath = await findFile(packageFiles, {
    startingFrom,
    test: hasWorkspacesInPackageFile,
  }).catch(() => undefined);

  if (pkgPath) {
    const rootDir = dirname(pkgPath);
    const pkg = await readPackage(rootDir, options);

    const workspaces = Array.isArray(pkg.workspaces)
      ? pkg.workspaces
      : (Array.isArray(pkg.workspaces?.packages)
        ? pkg.workspaces!.packages || []
        : []);

    let type: WorkspaceConfig["type"] = "npm";
    if (
      typeof pkg.packageManager === "string" &&
      pkg.packageManager.startsWith("yarn@")
    ) {
      type = "yarn";
    } else {
      const yarn = await fsp
        .stat(join(rootDir, "yarn.lock"))
        .then((s) => s.isFile())
        .catch(() => false);
      if (yarn) {
        type = "yarn";
      }
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
 * @param options - Options to modify the search and reading behaviour. See {@link ResolveOptions}.
 * @returns a promise resolving to a sorted list of workspace packages.
 */
export async function resolveWorkspacePackages(
  id?: string | WorkspaceConfig,
  options: ResolveOptions & ReadOptions = {},
): Promise<WorkspacePackage[]> {
  const root = isWorkspaceConfig(id) ? id : await resolveWorkspace(id, options);
  if (!root.packages || root.packages.length === 0) {
    return [];
  }

  const patterns = expandPatternsToPackageFiles(root.packages);
  const files = await glob(patterns, {
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
 * @param options - Options to modify the search and reading behaviour. See {@link ResolveOptions}.
 * @returns a promise resolving to a workspace graph.
 */
export async function resolveWorkspaceGraph(
  id?: string | WorkspaceConfig,
  options: ResolveOptions & ReadOptions = {},
): Promise<WorkspaceGraph> {
  const root = isWorkspaceConfig(id) ? id : await resolveWorkspace(id, options);
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
