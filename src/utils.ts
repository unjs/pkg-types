import { statSync } from 'fs'
import { join, resolve } from 'pathe'

export interface FindNearestFileOptions {
  /**
   * The starting directory for the search.
   * @default . (same as `process.cwd()`)
   */
  startingFrom?: string
  /**
   * A pattern to match a path segment above which you don't want to ascend
   * @default /^node_modules$/
   */
  rootPattern?: RegExp
  /**
   * A matcher that can evaluate whether the given path is a valid file (for example,
   * by testing whether the file path exists.
   *
   * @default fs.statSync(path).isFile()
   */
  test?: (filePath: string) => boolean | null | Promise<boolean | null>
}

const defaultFindOptions: Required<FindNearestFileOptions> = {
  startingFrom: '.',
  rootPattern: /^node_modules$/,
  test: (filePath: string) => {
    try {
      if (statSync(filePath).isFile()) { return true }
    } catch { }
    return null
  }
}

export async function findNearestFile (filename: string, _options: FindNearestFileOptions = {}): Promise<string> {
  const options = { ...defaultFindOptions, ..._options }
  const basePath = resolve(options.startingFrom)
  const leadingSlash = basePath[0] === '/'
  const segments = basePath.split('/').filter(Boolean)

  // Restore leading slash
  if (leadingSlash) {
    segments[0] = '/' + segments[0]
  }

  // Limit to node_modules scope if it exists
  let root = segments.findIndex(r => r.match(options.rootPattern))
  if (root === -1) { root = 0 }

  for (let i = segments.length; i > root; i--) {
    const filePath = join(...segments.slice(0, i), filename)
    if (await options.test(filePath)) { return filePath }
  }

  throw new Error(`Cannot find matching ${filename} in ${options.startingFrom} or parent directories`)
}
