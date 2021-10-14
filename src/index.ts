import * as JSON5 from 'json5'
import { promises as fsp } from 'fs'
import type { PackageJson, TSConfig } from './types'

export * from './types'

export function definePackageJSON(pkg: PackageJson): PackageJson {
  return pkg
}

export function defineTSConfig(tsconfig: TSConfig): TSConfig {
  return tsconfig
}

export async function readPackageJSON(path: string): Promise<PackageJson> {
  const blob = await fsp.readFile(path, 'utf-8')
  return JSON.parse(blob) as PackageJson
}

export async function writePackageJSON(path: string, pkg: PackageJson): Promise<void> {
  await fsp.writeFile(path, JSON.stringify(pkg, null, 2))
}

export async function readTSConfig(path: string): Promise<TSConfig> {
  const blob = await fsp.readFile(path, 'utf-8')
  return JSON5.parse(blob) as TSConfig
}

export async function writeTSConfig(path: string, tsconfig: TSConfig): Promise<void> {
  await fsp.writeFile(path, JSON5.stringify(tsconfig, null, 2))
}
