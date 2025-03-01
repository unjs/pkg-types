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
} from "./packagejson/utils";
