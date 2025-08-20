import type { FindFileOptions } from "./types";
import { statSync } from "node:fs";
import { join, resolve } from "pathe";

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

/**
 * Asynchronously finds a file by name, starting from the specified directory and traversing up (or down if reverse).
 * @param filename - The name of the file to find.
 * @param _options - Options to customise the search behaviour.
 * @returns a promise that resolves to the path of the file found.
 * @throws Will throw an error if the file cannot be found.
 */
export async function findFile(
  filename: string | string[],
  _options: FindFileOptions = {},
): Promise<string> {
  const filenames = Array.isArray(filename) ? filename : [filename];
  const options = { ...defaultFindOptions, ..._options };
  const basePath = resolve(options.startingFrom);
  const leadingSlash = basePath[0] === "/";
  const segments = basePath.split("/").filter(Boolean);

  // Test input itself first
  if (filenames.includes(segments.at(-1)!) && (await options.test(basePath))) {
    return basePath;
  }

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
      for (const filename of filenames) {
        const filePath = join(...segments.slice(0, index), filename);
        if (await options.test(filePath)) {
          return filePath;
        }
      }
    }
  } else {
    for (let index = segments.length; index > root; index--) {
      for (const filename of filenames) {
        const filePath = join(...segments.slice(0, index), filename);
        if (await options.test(filePath)) {
          return filePath;
        }
      }
    }
  }

  throw new Error(
    `Cannot find matching ${filename} in ${options.startingFrom} or parent directories`,
  );
}

/**
 * Asynchronously finds the next file with the given name, starting in the given directory and moving up.
 * Alias for findFile without reversing the search.
 * @param filename - The name of the file to find.
 * @param options - Options to customise the search behaviour.
 * @returns A promise that resolves to the path of the next file found.
 */
export function findNearestFile(
  filename: string | string[],
  options: FindFileOptions = {},
): Promise<string> {
  return findFile(filename, options);
}

/**
 * Asynchronously finds the furthest file with the given name, starting from the root directory and moving downwards.
 * This is essentially the reverse of `findNearestFile`.
 * @param filename - The name of the file to find.
 * @param options - Options to customise the search behaviour, with reverse set to true.
 * @returns A promise that resolves to the path of the farthest file found.
 */
export function findFarthestFile(
  filename: string | string[],
  options: FindFileOptions = {},
): Promise<string> {
  return findFile(filename, { ...options, reverse: true });
}
