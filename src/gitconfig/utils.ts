import type { GitConfig } from "./types";
import { readFile, writeFile } from "node:fs/promises";
import { findNearestFile } from "../resolve/utils";
import { parseINI } from "confbox/ini";
import { stringifyINI } from "confbox";

/**
 * Defines a GitConfig structure.
 */
export function defineGitConfig(config: GitConfig): GitConfig {
  return config;
}

/**
 * Asynchronously finds closest `.git/config` file.
 */
export async function resolveGitConfig(dir: string): Promise<string> {
  return findNearestFile(".git/config", { startingFrom: dir });
}

/**
 * Asynchronously finds and reads closest `.git/config` file.
 */
export async function readGitConfig(dir: string) {
  const path = await resolveGitConfig(dir);
  const blob = await readFile(path, "utf8");
  return parseGitConfig(blob);
}

/**
 * Asynchronously writes git config to a file.
 */
export async function writeGitConfig(path: string, config: GitConfig) {
  await writeFile(path, stringifyGitConfig(config));
}

/**
 * Parses a git config file INI format into a JavaScript object.
 */
export function parseGitConfig(blob: string): GitConfig {
  return parseINI(blob.replaceAll(/^\[(\w+) "(.+)"\]$/gm, '[$1.$2]'));
}

/**
 * Stringifies a git config object into a git config file INI format.
 */
export function stringifyGitConfig(config: GitConfig): string {
  return stringifyINI(config).replaceAll(/^\[(\w+)\.(\w+)\]$/gm, '[$1 "$2"]');
}
