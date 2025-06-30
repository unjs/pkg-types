// --- resolve ---

export type {
  FindFileOptions,
  ReadOptions,
  ResolveOptions,
} from "./resolve/types";

export { findFile, findFarthestFile, findNearestFile } from "./resolve/utils";

// --- tsconfig ---

export type { TSConfig } from "./tsconfig/types";

export {
  defineTSConfig,
  readTSConfig,
  writeTSConfig,
  resolveTSConfig,
} from "./tsconfig/utils";

// --- package.json ---

export type {
  PackageJson,
  PackageJsonExports,
  PackageJsonPerson,
} from "./packagejson/types";

export {
  definePackageJSON,
  readPackageJSON,
  writePackageJSON,
  resolvePackageJSON,
  resolveLockfile,
  findWorkspaceDir,
  readPackageJSON5,
  readPackageYAML,
  resolvePackageJSON5,
  resolvePackageYAML,
  writePackageJSON5,
  writePackageYAML,
} from "./packagejson/utils";

// --- git config ---

export type {
  GitConfig,
  GitBranch,
  GitCoreConfig,
  GitRemote,
  GitConfigUser,
} from "./gitconfig/types";

export {
  defineGitConfig,
  readGitConfig,
  writeGitConfig,
  resolveGitConfig,
  parseGitConfig,
  stringifyGitConfig,
} from "./gitconfig/utils";
