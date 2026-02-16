import type { CompilerOptions, TypeAcquisition } from "typescript";

type ExcludeEnum<T> = T extends boolean
  ? T
  : T extends string
    ? T
    : T extends Array<any>
      ? T
      : T extends object
        ? T
        : T extends undefined
          ? undefined
          : any;

export type StripEnums<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends undefined
    ? Omit<T, K> extends T // Is K key-optional?
      ? ExcludeEnum<T[K]>
      : undefined
    : ExcludeEnum<T[K]>;
};

export interface TSConfig {
  compilerOptions?: StripEnums<CompilerOptions>;
  exclude?: string[];
  compileOnSave?: boolean;
  extends?: string | string[];
  files?: string[];
  include?: string[];
  typeAcquisition?: TypeAcquisition;
  references?: { path: string }[];
}
