import * as jsonc from 'jsonc-parser'
import { promises as fsp } from 'fs'
import { findNearestFile } from './utils'
import { ResolveOptions, resolvePath } from 'mlly'
import type { PackageJson, TSConfig } from './types'
import { isAbsolute } from 'pathe'

export * from './types'
export * from './utils'

export function definePackageJSON(pkg: PackageJson): PackageJson {
  return pkg
}

export function defineTSConfig(tsconfig: TSConfig): TSConfig {
  return tsconfig
}

export async function readPackageJSON(id: string, opts: ResolveOptions = {}): Promise<PackageJson> {
  const resolvedPath = await resolvePackageJSON(id, opts)
  const blob = await fsp.readFile(resolvedPath, 'utf-8')
  return JSON.parse(blob) as PackageJson
}

export async function writePackageJSON(path: string, pkg: PackageJson): Promise<void> {
  await fsp.writeFile(path, JSON.stringify(pkg, null, 2))
}

export async function readTSConfig(id: string, opts: ResolveOptions = {}): Promise<TSConfig> {
  const resolvedPath = await resolveTSConfig(id, opts)
  const blob = await fsp.readFile(resolvedPath, 'utf-8')
  return jsonc.parse(blob) as TSConfig
}

export async function writeTSConfig(path: string, tsconfig: TSConfig): Promise<void> {
  await fsp.writeFile(path, JSON.stringify(tsconfig, null, 2))
}

export async function resolvePackageJSON (id: string = process.cwd(), opts: ResolveOptions = {}): Promise<string> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, opts)
  return findNearestFile('package.json', { startingFrom: resolvedPath })
}

export async function resolveTSConfig (id: string = process.cwd(), opts: ResolveOptions = {}): Promise<string> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, opts)
  return findNearestFile('tsconfig.json', { startingFrom: resolvedPath })
}
