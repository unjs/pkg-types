import type { GitConfig } from "./types";
import { readFile, writeFile } from "node:fs/promises";
import { findNearestFile } from "../resolve/utils";
import { parseINI, stringifyINI } from "confbox/ini";
import type { ResolveOptions } from "../resolve/types";

/**
 * Defines a git config object.
 */
export function defineGitConfig(config: GitConfig): GitConfig {
  return config;
}

/**
 * Finds closest `.git/config` file.
 */
export async function resolveGitConfig(
  dir: string,
  opts?: ResolveOptions,
): Promise<string> {
  return findNearestFile(".git/config", { ...opts, startingFrom: dir });
}

/**
 * Finds and reads closest `.git/config` file into a JS object.
 */
export async function readGitConfig(dir: string, opts?: ResolveOptions) {
  const path = await resolveGitConfig(dir, opts);
  const ini = await readFile(path, "utf8");
  return parseGitConfig(ini);
}

/**
 * Stringifies git config object into INI text format and writes it to a file.
 */
export async function writeGitConfig(path: string, config: GitConfig) {
  await writeFile(path, stringifyGitConfig(config));
}

/**
 * Parses a git config file in INI text format into a JavaScript object.
 */
export function parseGitConfig(ini: string): GitConfig {
  return parseINI(ini.replaceAll(/^\[(\w+) "(.+)"\]$/gm, "[$1.$2]"));
}

/**
 * Stringifies a git config object into a git config file INI text format.
 */
export function stringifyGitConfig(config: GitConfig): string {
  return stringifyINI(config).replaceAll(/^\[(\w+)\.(\w+)\]$/gm, '[$1 "$2"]');
}
