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
  baseUrl?: string;
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
  noLib?: boolean;
  noPropertyAccessFromIndexSignature?: boolean;
  noResolve?: boolean;
  noStrictGenericChecks?: boolean;
  noUncheckedIndexedAccess?: boolean;
  noUncheckedSideEffectImports?: boolean;
  noUnusedLocals?: boolean;
  noUnusedParameters?: boolean;
  outDir?: string;
  outFile?: string;
  paths?: Record<string, string[]>;
  plugins?: { name: string; [option: string]: any }[];
  preserveConstEnums?: boolean;
  preserveSymlinks?: boolean;
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
