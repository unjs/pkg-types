import type { CompilerOptions, TypeAcquisition } from 'typescript'

export interface TSConfig {
    compilerOptions: CompilerOptions;
    exclude: string[];
    compileOnSave: boolean;
    extends: string;
    files: string[];
    include: string[];
    typeAcquisition: TypeAcquisition
}
