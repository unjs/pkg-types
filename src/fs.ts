import { statSync } from 'fs'
import { join } from 'path'
import { PackageJson, readPackageJSON, readTSConfig, TSConfig } from '.'

export function findNearestFile (id: string, filename: string) {
  const leadingSlash = id[0] === '/'
  const segments = id.split('/').filter(Boolean)

  // Restore leading slash
  if (leadingSlash) {
    segments[0] = '/' + segments[0]
  }

  // Limit to node_modules scope if it exists
  let root = segments.indexOf('node_modules')
  if (root === -1) root = 0

  for (let i = segments.length; i > root; i--) {
    const filePath = join(...segments.slice(0, i), filename)
    try {
      if (statSync(filePath).isFile()) { return filePath }
    } catch { }
  }

  return null
}

export function findNearestPackageJSON (id: string = process.cwd()): string | null {
  return findNearestFile(id, 'package.json')
}

export function findNearestTSConfig (id: string = process.cwd()): string | null {
  return findNearestFile(id, 'tsconfig.json')
}

export async function readNearestPackageJSON (id?: string): Promise<PackageJson | null> {
  const path = findNearestPackageJSON(id)

  if (!path) { return null }

  return readPackageJSON(path)
}

export async function readNearestTSConfig (id?: string): Promise<TSConfig | null> {
  const path = findNearestTSConfig(id)

  if (!path) { return null }

  return readTSConfig(path)
}

