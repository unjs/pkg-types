import type { ResolveOptions as ExsolveResolveOptions } from "exsolve";

/**
 * Represents the options for resolving paths with additional file finding capabilities.
 */
export type ResolveOptions = Omit<FindFileOptions, "startingFrom"> & ExsolveResolveOptions & {
  /** @deprecated: use `from` */
  url?: string;

  /** @deprecated: use `from` */
  parent?: string;
};

/**
 * Options for reading files with optional caching.
 */
export type ReadOptions = {
  /**
   * Specifies whether the read results should be cached.
   * Can be a boolean or a map to hold the cached data.
   */
  cache?: boolean | Map<string, Record<string, any>>;
};

export interface FindFileOptions {
  /**
   * The starting directory for the search.
   * @default . (same as `process.cwd()`)
   */
  startingFrom?: string;
  /**
   * A pattern to match a path segment above which you don't want to ascend
   * @default /^node_modules$/
   */
  rootPattern?: RegExp;
  /**
   * If true, search starts from root level descending into subdirectories
   */
  reverse?: boolean;
  /**
   * A matcher that can evaluate whether the given path is a valid file (for example,
   * by testing whether the file path exists.
   *
   * @default fs.statSync(path).isFile()
   */
  test?: (
    filePath: string,
  ) => boolean | undefined | Promise<boolean | undefined>;
}

/** @deprecated */
export type FindNearestFileOptions = FindFileOptions;
