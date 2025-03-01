import type { ResolveOptions } from "./types";
import { resolveModulePath } from "exsolve";

export function _resolvePath(id: string, opts: ResolveOptions = {}) {
  return (
    resolveModulePath(id, {
      try: true,
      from: opts.parent || opts.url /* default is cwd */,
    }) || id
  );
}
