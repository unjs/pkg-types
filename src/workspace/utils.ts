import type { ResolveOptions, ReadOptions } from "../resolve/types";
import type {
  WorkspaceConfig,
  WorkspaceGraph,
  WorkspacePackage,
  WorkspacePackageNode,
} from "./types";
import { dirname, join, relative } from "pathe";
import { glob } from "tinyglobby";
import {
  findWorkspaceDir,
  findPackage,
  readPackage,
} from "../packagejson/utils";

const packageFiles = ["package.json", "package.json5", "package.yaml"];

export async function readWorkspaceConfig(
  id: string = process.cwd(),
  options: ResolveOptions & ReadOptions = {},
): Promise<WorkspaceConfig> {
  const rootDir = await findWorkspaceDir(id, options);
  const configPath = await findPackage(rootDir, options);
  const pkg = await readPackage(rootDir, options);
  const workspaces = Array.isArray(pkg.workspaces)
    ? pkg.workspaces
    : Array.isArray(pkg.workspaces?.packages)
      ? pkg.workspaces!.packages || []
      : [];
  return {
    type: "npm",
    rootDir,
    configPath,
    packages: workspaces,
    config: pkg,
  };
}

export async function readWorkspacePackages(
  id?: string,
  options: ResolveOptions & ReadOptions = {},
): Promise<WorkspacePackage[]> {
  const root = await readWorkspaceConfig(id, options);
  if (!root.packages || root.packages.length === 0) {
    return [];
  }
  const patterns = root.packages.flatMap((p) =>
    packageFiles.map((f) => join(p, f)),
  );
  const files = await glob(patterns, {
    cwd: root.rootDir,
    absolute: true,
  });
  const seen = new Set<string>();
  const pkgs: WorkspacePackage[] = [];
  for (const packageJsonPath of files) {
    const path = dirname(packageJsonPath);
    if (seen.has(path)) {
      continue;
    }
    seen.add(path);
    const packageJson = await readPackage(path, options);
    const name = packageJson.name || relative(root.rootDir, path);
    pkgs.push({
      name,
      path,
      relativePath: relative(root.rootDir, path),
      packageJsonPath,
      packageJson,
    });
  }
  return pkgs.sort((a, b) => a.name.localeCompare(b.name));
}

export async function readWorkspaceGraph(
  id?: string,
  options: ResolveOptions & ReadOptions = {},
): Promise<WorkspaceGraph> {
  const root = await readWorkspaceConfig(id, options);
  const pkgs = await readWorkspacePackages(root.rootDir, options);
  const names = new Set(pkgs.map((p) => p.name));

  const nodes: Record<string, WorkspacePackageNode> = {};
  const directDeps = new Map<string, Set<string>>();

  for (const p of pkgs) {
    const deps = new Set<string>(
      Object.keys(p.packageJson.dependencies || {}).filter((n) => names.has(n)),
    );
    const optDeps = new Set<string>(
      Object.keys(p.packageJson.optionalDependencies || {}).filter((n) =>
        names.has(n),
      ),
    );
    const devDeps = new Set<string>(
      Object.keys(p.packageJson.devDependencies || {}).filter((n) =>
        names.has(n),
      ),
    );

    const workspaceDependencies = [...new Set([...deps, ...optDeps])];
    const workspaceDevDependencies = [...devDeps];

    nodes[p.name] = {
      ...p,
      workspaceDependencies,
      workspaceDevDependencies,
      allWorkspaceDependencies: [],
    };

    directDeps.set(
      p.name,
      new Set([...workspaceDependencies, ...workspaceDevDependencies]),
    );
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const sorted: string[] = [];

  function dfs(name: string) {
    if (visited.has(name)) {
      return;
    }
    if (visiting.has(name)) {
      return;
    }
    visiting.add(name);
    for (const dep of directDeps.get(name) || []) {
      dfs(dep);
    }
    visiting.delete(name);
    visited.add(name);
    sorted.push(name);
  }

  for (const name of Object.keys(nodes)) {
    dfs(name);
  }

  const memo = new Map<string, Set<string>>();
  function collectAll(name: string): string[] {
    if (memo.has(name)) {
      return [...memo.get(name)!];
    }
    const acc = new Set<string>();
    const stack = [...(directDeps.get(name) || [])];
    const seen = new Set<string>();
    while (stack.length > 0) {
      const n = stack.pop()!;
      if (seen.has(n)) {
        continue;
      }
      seen.add(n);
      acc.add(n);
      for (const next of directDeps.get(n) || []) {
        if (!seen.has(next)) {
          stack.push(next);
        }
      }
    }
    memo.set(name, acc);
    return [...acc];
  }

  for (const name of Object.keys(nodes)) {
    nodes[name].allWorkspaceDependencies = collectAll(name);
  }

  return { packages: nodes, sorted, root };
}
