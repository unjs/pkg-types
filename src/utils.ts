import { statSync } from "node:fs";
import { join, resolve } from "pathe";

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

const defaultFindOptions: Required<FindFileOptions> = {
  startingFrom: ".",
  rootPattern: /^node_modules$/,
  reverse: false,
  test: (filePath: string) => {
    try {
      if (statSync(filePath).isFile()) {
        return true;
      }
    } catch {
      // Ignore
    }
  },
};

export async function findFile(
  filename: string,
  _options: FindFileOptions = {},
): Promise<string> {
  const options = { ...defaultFindOptions, ..._options };
  const basePath = resolve(options.startingFrom);
  const leadingSlash = basePath[0] === "/";
  const segments = basePath.split("/").filter(Boolean);

  // Restore leading slash
  if (leadingSlash) {
    segments[0] = "/" + segments[0];
  }

  // Limit to node_modules scope if it exists
  let root = segments.findIndex((r) => r.match(options.rootPattern));
  if (root === -1) {
    root = 0;
  }

  if (options.reverse) {
    for (let index = root + 1; index <= segments.length; index++) {
      const filePath = join(...segments.slice(0, index), filename);
      if (await options.test(filePath)) {
        return filePath;
      }
    }
  } else {
    for (let index = segments.length; index > root; index--) {
      const filePath = join(...segments.slice(0, index), filename);
      if (await options.test(filePath)) {
        return filePath;
      }
    }
  }

  throw new Error(
    `Cannot find matching ${filename} in ${options.startingFrom} or parent directories`,
  );
}

export function findNearestFile(
  filename: string,
  _options: FindFileOptions = {},
): Promise<string> {
  return findFile(filename, _options);
}

export function findFarthestFile(
  filename: string,
  _options: FindFileOptions = {},
): Promise<string> {
  return findFile(filename, { ..._options, reverse: true });
}
