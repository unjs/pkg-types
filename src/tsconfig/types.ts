export interface TSConfig {
  compilerOptions?: CompilerOptions;
  exclude?: string[];
  compileOnSave?: boolean;
  extends?: string | string[];
  files?: string[];
  include?: string[];
  typeAcquisition?: TypeAcquisition;
  references?: { path: string }[];
}

/**
 * Compiler options as they appear in `tsconfig.json`.
 *
 * Options that TypeScript models with an enum (`target`, `module`, ...) are typed as `any`,
 * since in JSON they are written as (case insensitive) strings.
 *
 * Options TypeScript has since removed are kept and marked as `@deprecated`,
 * so that older `tsconfig.json` files still resolve to a known option.
 */
export interface CompilerOptions {
  allowArbitraryExtensions?: boolean;
  allowImportingTsExtensions?: boolean;
  allowJs?: boolean;
  allowNonTsExtensions?: boolean;
  allowSyntheticDefaultImports?: boolean;
  allowUmdGlobalAccess?: boolean;
  allowUnreachableCode?: boolean;
  allowUnusedLabels?: boolean;
  alwaysStrict?: boolean;
  assumeChangesOnlyAffectDirectDependencies?: boolean;
  /** @deprecated Deprecated since TypeScript 6.0 and removed in 7.0. Use `paths` with `{ "*": ["./*"] }` instead. */
  baseUrl?: string;
  /** @deprecated Deprecated since TypeScript 5.0 and removed in 5.6. */
  charset?: string;
  checkJs?: boolean;
  composite?: boolean;
  customConditions?: string[];
  declaration?: boolean;
  declarationDir?: string;
  declarationMap?: boolean;
  deduplicatePackages?: boolean;
  disableReferencedProjectLoad?: boolean;
  disableSizeLimit?: boolean;
  disableSolutionSearching?: boolean;
  disableSourceOfProjectReferenceRedirect?: boolean;
  /** @deprecated Deprecated since TypeScript 6.0 and removed in 7.0. */
  downlevelIteration?: boolean;
  emitBOM?: boolean;
  emitDeclarationOnly?: boolean;
  emitDecoratorMetadata?: boolean;
  erasableSyntaxOnly?: boolean;
  esModuleInterop?: boolean;
  exactOptionalPropertyTypes?: boolean;
  experimentalDecorators?: boolean;
  forceConsistentCasingInFileNames?: boolean;
  ignoreConfig?: boolean;
  ignoreDeprecations?: string;
  importHelpers?: boolean;
  /** @deprecated Deprecated since TypeScript 5.0 and removed in 7.0. Use `verbatimModuleSyntax` instead. */
  importsNotUsedAsValues?: any;
  incremental?: boolean;
  init?: boolean;
  inlineSourceMap?: boolean;
  inlineSources?: boolean;
  isolatedDeclarations?: boolean;
  isolatedModules?: boolean;
  jsx?: any;
  jsxFactory?: string;
  jsxFragmentFactory?: string;
  jsxImportSource?: string;
  /** @deprecated Deprecated since TypeScript 5.0 and removed in 5.6. */
  keyofStringsOnly?: boolean;
  lib?: string[];
  libReplacement?: boolean;
  locale?: string;
  mapRoot?: string;
  maxNodeModuleJsDepth?: number;
  module?: any;
  moduleDetection?: any;
  moduleResolution?: any;
  moduleSuffixes?: string[];
  newLine?: any;
  noCheck?: boolean;
  noEmit?: boolean;
  noEmitHelpers?: boolean;
  noEmitOnError?: boolean;
  noErrorTruncation?: boolean;
  noFallthroughCasesInSwitch?: boolean;
  noImplicitAny?: boolean;
  noImplicitOverride?: boolean;
  noImplicitReturns?: boolean;
  noImplicitThis?: boolean;
  /** @deprecated Deprecated since TypeScript 5.0 and removed in 5.6. */
  noImplicitUseStrict?: boolean;
  noLib?: boolean;
  noPropertyAccessFromIndexSignature?: boolean;
  noResolve?: boolean;
  /** @deprecated Deprecated since TypeScript 5.0 and removed in 5.6. */
  noStrictGenericChecks?: boolean;
  noUncheckedIndexedAccess?: boolean;
  noUncheckedSideEffectImports?: boolean;
  noUnusedLocals?: boolean;
  noUnusedParameters?: boolean;
  /** @deprecated Deprecated since TypeScript 5.0 and removed in 5.6. Use `outFile` instead. */
  out?: string;
  outDir?: string;
  /** @deprecated Deprecated since TypeScript 6.0 and removed in 7.0. */
  outFile?: string;
  paths?: Record<string, string[]>;
  plugins?: { name: string; [option: string]: any }[];
  preserveConstEnums?: boolean;
  preserveSymlinks?: boolean;
  /** @deprecated Deprecated since TypeScript 5.0 and removed in 5.6. Use `verbatimModuleSyntax` instead. */
  preserveValueImports?: boolean;
  project?: string;
  reactNamespace?: string;
  removeComments?: boolean;
  resolveJsonModule?: boolean;
  resolvePackageJsonExports?: boolean;
  resolvePackageJsonImports?: boolean;
  rewriteRelativeImportExtensions?: boolean;
  rootDir?: string;
  rootDirs?: string[];
  skipDefaultLibCheck?: boolean;
  skipLibCheck?: boolean;
  sourceMap?: boolean;
  sourceRoot?: string;
  stableTypeOrdering?: boolean;
  strict?: boolean;
  strictBindCallApply?: boolean;
  strictBuiltinIteratorReturn?: boolean;
  strictFunctionTypes?: boolean;
  strictNullChecks?: boolean;
  strictPropertyInitialization?: boolean;
  stripInternal?: boolean;
  /** @deprecated Deprecated since TypeScript 5.0 and removed in 5.6. */
  suppressExcessPropertyErrors?: boolean;
  /** @deprecated Deprecated since TypeScript 5.0 and removed in 5.6. */
  suppressImplicitAnyIndexErrors?: boolean;
  suppressOutputPathCheck?: boolean;
  target?: any;
  traceResolution?: boolean;
  tsBuildInfoFile?: string;
  typeRoots?: string[];
  types?: string[];
  useDefineForClassFields?: boolean;
  useUnknownInCatchVariables?: boolean;
  verbatimModuleSyntax?: boolean;
  [option: string]: any;
}

export interface TypeAcquisition {
  enable?: boolean;
  include?: string[];
  exclude?: string[];
  disableFilenameBasedTypeAcquisition?: boolean;
}
