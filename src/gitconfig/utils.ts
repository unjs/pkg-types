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

// Inside a quoted git subsection name a backslash escapes the next character:
// `\"` and `\\` stand for `"` and `\`, and git drops the backslash before
// anything else, so `[remote "foo\q"]` names the remote `fooq`.
const _unescapeGitSubsection = (name: string) => name.replaceAll(/\\(.)/g, "$1");
const _escapeGitSubsection = (name: string) => name.replaceAll(/(["\\])/g, "\\$1");

// `confbox/ini` reads a section header by splitting on unescaped `.` and
// unescaping `\.` and `\\`, so both characters are escaped on the way in.
const _escapeINISection = (name: string) =>
  name.replaceAll("\\", String.raw`\\`).replaceAll(".", String.raw`\.`);

// Writing is not the mirror image of that: `confbox/ini` escapes `.` in a key
// but leaves `\` untouched, so `a.b` and String.raw`a\.b` would both be written
// as String.raw`a\.b`. Subsection names are therefore handed to the writer
// percent-encoded, which keeps `.` and `\` out of the header entirely.
const _encodeINISection = (name: string) => encodeURIComponent(name).replaceAll(".", "%2E");
const _decodeINISection = (name: string) => decodeURIComponent(name);

const _isSubsection = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Parses a git config file in INI text format into a JavaScript object.
 */
export function parseGitConfig(ini: string): GitConfig {
  return parseINI(
    ini.replaceAll(
      /^\[(\w+) "(.*)"\]$/gm,
      (_, section, subsection) =>
        `[${section}.${_escapeINISection(_unescapeGitSubsection(subsection))}]`,
    ),
  );
}

/**
 * Stringifies a git config object into a git config file INI text format.
 */
export function stringifyGitConfig(config: GitConfig): string {
  const encoded: Record<string, unknown> = {};
  for (const [section, value] of Object.entries(config)) {
    if (!_isSubsection(value)) {
      encoded[section] = value;
      continue;
    }
    const entries: Record<string, unknown> = {};
    for (const [key, subValue] of Object.entries(value)) {
      entries[_isSubsection(subValue) ? _encodeINISection(key) : key] = subValue;
    }
    encoded[section] = entries;
  }

  return stringifyINI(encoded).replaceAll(
    /^\[(\w+)\.(.*)\]$/gm,
    (_, section, subsection) =>
      `[${section} "${_escapeGitSubsection(_decodeINISection(subsection))}"]`,
  );
}
