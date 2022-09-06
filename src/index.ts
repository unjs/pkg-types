import { promises as fsp } from 'fs'
import { ResolveOptions as _ResolveOptions, resolvePath } from 'mlly'
import { isAbsolute } from 'pathe'
import { findFile, FindFileOptions, findNearestFile } from './utils'
import type { PackageJson, TSConfig } from './types'
import { dirname, resolve } from 'path'

export * from './types'
export * from './utils'

export type ResolveOptions = _ResolveOptions & FindFileOptions

export function definePackageJSON (pkg: PackageJson): PackageJson {
  return pkg
}

export function defineTSConfig (tsconfig: TSConfig): TSConfig {
  return tsconfig
}

export async function readPackageJSON (id: string, opts: ResolveOptions = {}): Promise<PackageJson> {
  const resolvedPath = await resolvePackageJSON(id, opts)
  const blob = await fsp.readFile(resolvedPath, 'utf-8')
  return JSON.parse(blob) as PackageJson
}

export async function writePackageJSON (path: string, pkg: PackageJson): Promise<void> {
  await fsp.writeFile(path, JSON.stringify(pkg, null, 2))
}

export async function readTSConfig (id: string, opts: ResolveOptions = {}): Promise<TSConfig> {
  const resolvedPath = await resolveTSConfig(id, opts)
  const blob = await fsp.readFile(resolvedPath, 'utf-8')
  const jsonc = await import('jsonc-parser')
  return jsonc.parse(blob) as TSConfig
}

export async function writeTSConfig (path: string, tsconfig: TSConfig): Promise<void> {
  await fsp.writeFile(path, JSON.stringify(tsconfig, null, 2))
}

export async function resolvePackageJSON (id: string = process.cwd(), opts: ResolveOptions = {}): Promise<string> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, opts)
  return findNearestFile('package.json', { startingFrom: resolvedPath, ...opts })
}

export async function resolveTSConfig (id: string = process.cwd(), opts: ResolveOptions = {}): Promise<string> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, opts)
  return findNearestFile('tsconfig.json', { startingFrom: resolvedPath, ...opts })
}

const lockFiles = ['yarn.lock', 'package-lock.json', 'pnpm-lock.yaml', 'npm-shrinkwrap.json']

export async function resolveLockfile (id: string = process.cwd(), opts: ResolveOptions = {}): Promise<string> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, opts)
  const _opts = { startingFrom: resolvedPath, ...opts }
  for (const lockFile of lockFiles) {
    try {
      return await findNearestFile(lockFile, _opts)
    } catch { }
  }
  throw new Error('No lockfile found from ' + id)
}

export async function findWorkspaceDir (id: string = process.cwd(), opts: ResolveOptions = {}): Promise<string> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, opts)
  const _opts = { startingFrom: resolvedPath, reverse: true, ...opts }

  // Lookup for .git/config
  try {
    const r = await findFile('.git/config', _opts)
    return resolve(r, '../..')
  } catch { }

  // Lookup for lockfile
  try {
    const r = await resolveLockfile(resolvedPath, _opts)
    return dirname(r)
  } catch { }

  // Lookup for package.json
  try {
    const r = await findFile(resolvedPath, _opts)
    return dirname(r)
  } catch { }

  throw new Error('Cannot detect workspace root from ' + id)
}
