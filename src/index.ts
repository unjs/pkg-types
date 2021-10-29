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

/**
 * @example
 * ```js
 * import { readPackageJSON } from 'pkg-types'
 * const packageJson = await readPackageJSON()
 * // or
 * const packageJson = await readPackageJSON('/fully/resolved/path/to/folder')
 * ```
 */
export async function readPackageJSON(id: string, opts: ResolveOptions = {}): Promise<PackageJson> {
  const resolvedPath = await resolvePackageJSON(id, opts)
  const blob = await fsp.readFile(resolvedPath, 'utf-8')
  return JSON.parse(blob) as PackageJson
}

/**
 * @example
 * ```js
 * import { writePackageJSON } from 'pkg-types'
 * await writePackageJSON('path/to/package.json', pkg)
 * ```
 */
export async function writePackageJSON(path: string, pkg: PackageJson): Promise<void> {
  await fsp.writeFile(path, JSON.stringify(pkg, null, 2))
}


/**
 * @example
* ```js
* import { readTSConfig } from 'pkg-types'
* const tsconfig = await readTSConfig()
* // or
* const tsconfig = await readTSConfig('/fully/resolved/path/to/folder')
* ```
 */
export async function readTSConfig(id: string, opts: ResolveOptions = {}): Promise<TSConfig> {
  const resolvedPath = await resolveTSConfig(id, opts)
  const blob = await fsp.readFile(resolvedPath, 'utf-8')
  return jsonc.parse(blob) as TSConfig
}

/**
 * @example
 * ```js
 * import { writeTSConfig } from 'pkg-types'
 * await writeTSConfig('path/to/tsconfig.json', tsconfig)
 * ```
 */
export async function writeTSConfig(path: string, tsconfig: TSConfig): Promise<void> {
  await fsp.writeFile(path, JSON.stringify(tsconfig, null, 2))
}

/**
 * @example
 * ```js
 * import { resolvePackageJSON } from 'pkg-types'
 * const filename = await resolvePackageJSON()
 * // or
 * const packageJson = await resolvePackageJSON('/fully/resolved/path/to/folder')
 * ```
 */
export async function resolvePackageJSON (id: string = process.cwd(), opts: ResolveOptions = {}): Promise<string> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, opts)
  return findNearestFile('package.json', { startingFrom: resolvedPath })
}

/**
 * @example
 * ```js
 * import { resolveTSConfig } from 'pkg-types'
 * const filename = await resolveTSConfig()
 * // or
 * const tsconfig = await resolveTSConfig('/fully/resolved/path/to/folder')
 * ```
 */
export async function resolveTSConfig (id: string = process.cwd(), opts: ResolveOptions = {}): Promise<string> {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, opts)
  return findNearestFile('tsconfig.json', { startingFrom: resolvedPath })
}
