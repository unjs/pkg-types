import { statSync } from 'fs'

export const isFile = (path: string): boolean => {
  try {
    if (statSync(path).isFile()) { return true }
  } catch {}
  return false
}
