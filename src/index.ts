import { promises as fsp } from 'fs'
import * as jsonc from 'jsonc-parser'
import { ResolveOptions as _ResolveOptions, resolvePath } from 'mlly'
import { isAbsolute, join } from 'pathe'
import { findNearestFile, FindNearestFileOptions } from './utils'
import type { PackageJson, TSConfig } from './types'
import { isFile } from './_utils'

export * from './types'
export * from './utils'

export type ResolveOptions = _ResolveOptions & FindNearestFileOptions

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

const rootFiles = ['pnpm-workspace.yaml', 'pnpm-lock.yaml', 'yarn.lock', 'lerna.json']

export async function resolveRootPackageJSON (id: string = process.cwd(), opts: ResolveOptions = {}): Promise<string> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, opts)
  try {
    return await findNearestFile('package.json', {
      startingFrom: resolvedPath,
      test: async (filePath) => {
        if (!isFile(filePath)) {
          return false
        }
        if (rootFiles.some(file => isFile(join(filePath, '..', file)))) {
          return true
        }
        try {
          const blob = await fsp.readFile(resolvedPath, 'utf-8')
          return !!(JSON.parse(blob) as PackageJson).workspaces
        } catch {}
        return false
      },
      ...opts
    })
  } catch {
    return findNearestFile('package.json', { startingFrom: resolvedPath, ...opts })
  }
}
