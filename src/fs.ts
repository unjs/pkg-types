import { statSync } from 'fs'
import { join, resolve } from 'pathe'
import { PackageJson, readPackageJSON, readTSConfig, TSConfig } from '.'

export interface FindNearestFileOptions {
  /** A pattern to match a path segment above which you don't want to ascend */
  rootPattern?: RegExp
  /**
   * A matcher that can evaluate whether the given path is a valid file (for example,
   * by testing whether the file path exists.
   */
  matcher?: (filePath: string) => boolean | null
}

const defaultFindOptions = {
  rootPattern: /^node_modules$/,
  matcher: (filePath: string) => {
    try {
      if (statSync(filePath).isFile()) { return true }
    } catch { }
  }
}

export function findNearestFile (id: string, filename: string, _options: FindNearestFileOptions = {}) {
  const options = { ...defaultFindOptions, ..._options }
  const basePath = resolve(id)
  const leadingSlash = basePath[0] === '/'
  const segments = basePath.split('/').filter(Boolean)

  // Restore leading slash
  if (leadingSlash) {
    segments[0] = '/' + segments[0]
  }

  // Limit to node_modules scope if it exists
  let root = segments.findIndex(r => r.match(options.rootPattern))
  if (root === -1) root = 0

  for (let i = segments.length; i > root; i--) {
    const filePath = join(...segments.slice(0, i), filename)
    if (options.matcher(filePath)) { return filePath }
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

