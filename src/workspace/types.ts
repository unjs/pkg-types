import type { PackageJson } from "../packagejson/types";

export type WorkspaceType =
  | "npm"
  | "pnpm"
  | "yarn"
  | "bun"
  | "lerna"
  | "nx"
  | "rush"
  | "turbo"
  | "deno";

export interface WorkspaceConfig {
  type: WorkspaceType;
  rootDir: string;
  configPath: string;
  packages: string[];
  config: any;
}

export interface WorkspacePackage {
  name: string;
  path: string;
  relativePath: string;
  packageJsonPath: string;
  packageJson: PackageJson;
}

export interface WorkspacePackageNode extends WorkspacePackage {
  workspaceDependencies: string[];
  workspaceDevDependencies: string[];
  allWorkspaceDependencies: string[];
}

export interface WorkspaceGraph {
  packages: Record<string, WorkspacePackageNode>;
  sorted: string[];
  root: WorkspaceConfig;
}
