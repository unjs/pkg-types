import { promises as fsp } from "node:fs";
import { join, resolve } from "pathe";
import { parseYAML, parseJSON, parseJSONC } from "confbox";
import type { WorkspacePackage, WorkspacePackageNode } from "./types";
import { readPackage } from "../packagejson/utils";

export const packageFiles = ["package.json", "package.json5", "package.yaml"];

export function expandPatternsToPackageFiles(patterns: string[]): string[] {
  const out: string[] = [];
  for (const p of patterns) {
    for (const f of packageFiles) {
      out.push(join(p, f));
    }
  }
  return out;
}

export async function readPNPMWorkspace(rootDir: string): Promise<{
  packages: string[];
  config: any;
  configPath: string;
} | undefined> {
  const configPath = join(rootDir, "pnpm-workspace.yaml");
  try {
    const src = await fsp.readFile(configPath, "utf8");
    const conf = parseYAML(src) as any;
    const packages =
      Array.isArray(conf?.packages) && conf.packages.length > 0
        ? conf.packages
        : [];
    return { packages, config: conf, configPath };
  } catch {
    return undefined;
  }
}

export async function readLernaWorkspace(rootDir: string): Promise<{
  packages: string[];
  config: any;
  configPath: string;
} | undefined> {
  const configPath = join(rootDir, "lerna.json");
  try {
    const src = await fsp.readFile(configPath, "utf8");
    const conf = JSON.parse(src) as any;
    const packages =
      Array.isArray(conf?.packages) && conf.packages.length > 0
        ? conf.packages
        : [];
    if (packages.length > 0) {
      return { packages, config: conf, configPath };
    }
  } catch {
    // Ignore
  }
  return undefined;
}

export async function readRushWorkspace(rootDir: string): Promise<{
  packages: string[];
  config: any;
  configPath: string;
} | undefined> {
  const configPath = join(rootDir, "rush.json");
  try {
    const src = await fsp.readFile(configPath, "utf8");
    const conf = JSON.parse(src) as any;
    const projects = Array.isArray(conf?.projects) ? conf.projects : [];
    const packages =
      projects.length > 0
        ? projects
            .map((p: any) => p?.projectFolder)
            .filter((p: unknown): p is string => typeof p === "string")
        : [];
    if (packages.length > 0) {
      return { packages, config: conf, configPath };
    }
  } catch {
    // Ignore
  }
  return undefined;
}

export async function readDenoWorkspace(rootDir: string): Promise<{
  packages: string[];
  config: any;
  configPath: string;
} | undefined> {
  for (const name of ["deno.json", "deno.jsonc"]) {
    const configPath = join(rootDir, name);
    try {
      const src = await fsp.readFile(configPath, "utf8");
      let conf: any;
      try {
        conf = parseJSON(src);
      } catch {
        conf = parseJSONC(src);
      }
      let packages: string[] = [];
      if (Array.isArray(conf?.workspace)) {
        packages = conf.workspace;
      } else if (Array.isArray(conf?.workspace?.members)) {
        packages = conf.workspace.members;
      }
      if (packages.length > 0) {
        return { packages, config: conf, configPath };
      }
    } catch {
      // Ignore
    }
  }
  return undefined;
}

export async function hasWorkspacesInPackageFile(filePath: string): Promise<boolean> {
  try {
    const pkg = await readPackage(filePath);
    if (Array.isArray(pkg.workspaces)) {
      return pkg.workspaces.length > 0;
    }
    if (Array.isArray(pkg.workspaces?.packages)) {
      return pkg.workspaces.packages.length > 0;
    }
    return false;
  } catch {
    return false;
  }
}

export function resolveWorkspaceTarget(
  depName: string,
  spec: string,
  fromDir: string,
  byPathName: Map<string, string>,
): string | undefined {
  if (!spec.startsWith("workspace:")) {
    return undefined;
  }
  const specifier = spec.slice("workspace:".length).trim();
  if (specifier.length === 0) {
    return undefined;
  }
  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    const dir = specifier.startsWith("/") ? specifier : resolve(fromDir, specifier);
    return byPathName.get(dir);
  }
  const at = specifier.lastIndexOf("@");
  if (at > 0) {
    return specifier.slice(0, at);
  }
  const first = specifier[0];
  if (
    first === "^" ||
    first === "~" ||
    first === ">" ||
    first === "<" ||
    first === "=" ||
    first === "v" ||
    /\d/.test(first)
  ) {
    return depName;
  }
  return specifier;
}

export function topoSort(names: string[], edges: Map<string, Set<string>>): string[] {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const out: string[] = [];
  function dfs(n: string) {
    if (visited.has(n)) return;
    if (visiting.has(n)) return;
    visiting.add(n);
    for (const d of edges.get(n) || []) dfs(d);
    visiting.delete(n);
    visited.add(n);
    out.push(n);
  }
  for (const n of names) dfs(n);
  return out;
}

export function collectAllDependencies(name: string, edges: Map<string, Set<string>>): string[] {
  const collected = new Set<string>();
  const seen = new Set<string>();
  const stack = [...(edges.get(name) || [])];
  while (stack.length > 0) {
    const curr = stack.pop()!;
    if (seen.has(curr)) {
      continue;
    }
    seen.add(curr);
    collected.add(curr);
    for (const next of edges.get(curr) || []) {
      if (!seen.has(next)) {
        stack.push(next);
      }
    }
  }
  return [...collected];
}

export function buildWorkspaceGraph(
  packages: WorkspacePackage[],
): { nodes: Record<string, WorkspacePackageNode>; sorted: string[] } {
  const packageNames = new Set(packages.map((p) => p.name));
  const byPathName = new Map(packages.map((p) => [p.path, p.name]));
  const nodes: Record<string, WorkspacePackageNode> = {};
  const edges = new Map<string, Set<string>>();
  for (const p of packages) {
    const dependenciesObject = p.packageJson.dependencies || {};
    const optionalDependenciesObject = p.packageJson.optionalDependencies || {};
    const devDependenciesObject = p.packageJson.devDependencies || {};
    const dependenciesSet = new Set<string>();
    for (const [name, value] of Object.entries(dependenciesObject)) {
      const spec = String(value);
      const t = resolveWorkspaceTarget(name, spec, p.path, byPathName);
      if (t && packageNames.has(t)) {
        dependenciesSet.add(t);
        continue;
      }
      if (!spec.startsWith("npm:") && packageNames.has(name)) {
        dependenciesSet.add(name);
      }
    }
    for (const [name, value] of Object.entries(optionalDependenciesObject)) {
      const spec = String(value);
      const t = resolveWorkspaceTarget(name, spec, p.path, byPathName);
      if (t && packageNames.has(t)) {
        dependenciesSet.add(t);
        continue;
      }
      if (!spec.startsWith("npm:") && packageNames.has(name)) {
        dependenciesSet.add(name);
      }
    }
    const devDependenciesSet = new Set<string>();
    for (const [name, value] of Object.entries(devDependenciesObject)) {
      const spec = String(value);
      const t = resolveWorkspaceTarget(name, spec, p.path, byPathName);
      if (t && packageNames.has(t)) {
        devDependenciesSet.add(t);
        continue;
      }
      if (!spec.startsWith("npm:") && packageNames.has(name)) {
        devDependenciesSet.add(name);
      }
    }
    const workspaceDependencies = [...dependenciesSet];
    const workspaceDevDependencies = [...devDependenciesSet];
    nodes[p.name] = {
      ...p,
      workspaceDependencies,
      workspaceDevDependencies,
      allWorkspaceDependencies: [],
    };
    edges.set(p.name, new Set([...workspaceDependencies, ...workspaceDevDependencies]));
  }
  const sorted = topoSort(Object.keys(nodes), edges);
  for (const n of Object.keys(nodes)) {
    nodes[n].allWorkspaceDependencies = collectAllDependencies(n, edges);
  }
  return { nodes, sorted };
}
