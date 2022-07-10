import { promises as fsp } from 'fs'
import { ResolveOptions, resolvePath } from 'mlly'
import { isAbsolute, join } from 'pathe'
import { PackageJson } from './types'
import { findNearestFile } from './utils'
import { isFile } from './_utils'
import { resolvePackageJSON } from '.'

const rootFiles = ['pnpm-workspace.yaml', 'pnpm-lock.yaml', 'yarn.lock', 'lerna.json']

export async function findWorkspaceRoot (id: string = process.cwd(), opts: ResolveOptions = {}): Promise<string> {
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
    return resolvePackageJSON(id, opts)
  }
}
