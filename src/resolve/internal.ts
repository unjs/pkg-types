import { isAbsolute, normalize } from "pathe";
import type { ResolveOptions } from "./types";
import { resolveModulePath } from "exsolve";
import { fileURLToPath } from "node:url";

export function _resolvePath(id: URL | string, opts: ResolveOptions = {}) {
  if (id instanceof URL || id.startsWith("file://")) {
    return normalize(fileURLToPath(id));
  }

  if (isAbsolute(id)) {
    return normalize(id);
  }

  return resolveModulePath(id, {
    ...opts,
    from: opts.from || opts.parent || opts.url /* default is cwd */,
  });
}
