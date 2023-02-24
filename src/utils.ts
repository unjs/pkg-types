import { statSync, existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "pathe";
import detectIndent from "detect-indent";

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
    filePath: string
  ) => boolean | undefined | Promise<boolean | undefined>;
}

/** @deprecated */
export type FindNearestFileOptions = FindFileOptions;

export type WriteOptions = {
  indent?: number | string;
  newline?: boolean | string;
};

export type ResolvedWriteOptions = {
  indent: number | string;
  newline: string;
};

const defaultFindOptions: Required<FindFileOptions> = {
  startingFrom: ".",
  rootPattern: /^node_modules$/,
  reverse: false,
  test: (filePath: string) => {
    try {
      if (statSync(filePath).isFile()) {
        return true;
      }
    } catch {}
  },
};

export async function findFile(
  filename: string,
  _options: FindFileOptions = {}
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

  if (!options.reverse) {
    for (let index = segments.length; index > root; index--) {
      const filePath = join(...segments.slice(0, index), filename);
      if (await options.test(filePath)) {
        return filePath;
      }
    }
  } else {
    for (let index = root + 1; index <= segments.length; index++) {
      const filePath = join(...segments.slice(0, index), filename);
      if (await options.test(filePath)) {
        return filePath;
      }
    }
  }

  throw new Error(
    `Cannot find matching ${filename} in ${options.startingFrom} or parent directories`
  );
}

export function findNearestFile(
  filename: string,
  _options: FindFileOptions = {}
): Promise<string> {
  return findFile(filename, _options);
}

export function findFarthestFile(
  filename: string,
  _options: FindFileOptions = {}
): Promise<string> {
  return findFile(filename, { ..._options, reverse: true });
}

export async function resolveWriteOptions(
  path: string,
  options: WriteOptions
): Promise<ResolvedWriteOptions> {
  const file = existsSync(path) ? await readFile(path, "utf8") : undefined;
  const indent = options.indent ?? (file ? detectIndent(file).indent : 2);
  const newline =
    options.newline === true
      ? "\n"
      : options.newline === false
      ? ""
      : options.newline ?? (file ? (file.endsWith("\n") ? "\n" : "") : "\n");

  return {
    indent,
    newline,
  };
}

export async function writeJsonFile(
  path: string,
  value: any,
  options: WriteOptions = {}
): Promise<void> {
  const resolvedOpts = await resolveWriteOptions(path, options);

  let content = JSON.stringify(value, undefined, resolvedOpts.indent);
  content += resolvedOpts.newline;

  await writeFile(path, content);
}
