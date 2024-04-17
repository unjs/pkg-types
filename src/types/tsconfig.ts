import type { CompilerOptions, TypeAcquisition } from "typescript";

export type StripEnums<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends boolean
    ? T[K]
    : T[K] extends string
      ? T[K]
      : T[K] extends object
        ? T[K]
        : T[K] extends Array<any>
          ? T[K]
          : T[K] extends undefined
            ? undefined
            : any;
};

export interface TSConfig {
  compilerOptions?: StripEnums<CompilerOptions>;
  exclude?: string[];
  compileOnSave?: boolean;
  extends?: string | string[];
  files?: string[];
  include?: string[];
  typeAcquisition?: TypeAcquisition;
}
