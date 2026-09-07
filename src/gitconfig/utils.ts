import type { GitConfig } from "./types";
import { readFile, writeFile } from "node:fs/promises";
import { findNearestFile } from "../resolve/utils";
import { _resolvePath } from "../resolve/internal";
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
export async function resolveGitConfig(dir: string, opts?: ResolveOptions): Promise<string> {
  return findNearestFile(".git/config", {
    ...opts,
    startingFrom: _resolvePath(dir, opts),
  });
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

// Inside a quoted git subsection name, only `\"` and `\\` are escape sequences.
const _unescapeGitSubsection = (name: string) => name.replaceAll(/\\(["\\])/g, "$1");
const _escapeGitSubsection = (name: string) => name.replaceAll(/(["\\])/g, "\\$1");

// `confbox/ini` splits a section header on unescaped `.` and joins on `\.`,
// so a literal dot has to survive the trip through the INI layer escaped.
const _escapeINISection = (name: string) => name.replaceAll(".", String.raw`\.`);
const _unescapeINISection = (name: string) => name.replaceAll(String.raw`\.`, ".");

/**
 * Parses a git config file in INI text format into a JavaScript object.
 */
export function parseGitConfig(ini: string): GitConfig {
  return parseINI(
    ini.replaceAll(
      /^\[(\w+) "(.+)"\]$/gm,
      (_, section, subsection) =>
        `[${section}.${_escapeINISection(_unescapeGitSubsection(subsection))}]`,
    ),
  );
}

/**
 * Stringifies a git config object into a git config file INI text format.
 */
export function stringifyGitConfig(config: GitConfig): string {
  return stringifyINI(config).replaceAll(
    /^\[(\w+)\.(.+)\]$/gm,
    (_, section, subsection) =>
      `[${section} "${_escapeGitSubsection(_unescapeINISection(subsection))}"]`,
  );
}
