import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { expectTypeOf } from "expect-type";
import {
  readPackageJSON,
  readTSConfig,
  resolveTSConfig,
  resolvePackageJSON,
  writePackageJSON,
  writeTSConfig,
  TSConfig,
  ResolveOptions,
  resolveLockfile,
  findWorkspaceDir
} from "../src";

const fixtureDir = resolve(dirname(fileURLToPath(import.meta.url)), "fixture");

const rFixture = (...p: string[]) => resolve(fixtureDir, ...p);

async function expectToReject (p: Promise<any>) {
  return expect(await p.then(() => {}).catch((error: Error) => error.toString()));
}

function testResolve (filename: string, resolveFunction: (id?: string, options?: ResolveOptions) => Promise<string | null>) {
  it("finds a package.json in root directory", async () => {
    const packagePath = await resolveFunction(rFixture("."));
    expect(packagePath).to.equal(rFixture(filename));
  });
  it("finds package.json from root", async () => {
    const packagePath = await resolveFunction(rFixture("."), { reverse: true });
    expect(packagePath).to.equal(rFixture("../..", filename)); // Top level in pkg-types repo
  });
  it("handles non-existent paths", async () => {
    const packagePath = await resolveFunction(rFixture("further", "dir", "file.json"));
    expect(packagePath).to.equal(rFixture(filename));
  });
  it("works all the way up the tree", async () => {
    (await expectToReject(resolveFunction("/a/full/nonexistent/path"))).to.contain("Cannot find matching");
  });
  it("stops at `node_modules`", async () => {
    (await expectToReject(resolveFunction(rFixture("further", "node_modules", "file.json")))).to.contain("Cannot find matching");
  });
  it("finds the working directory", async () => {
    const packagePath = await resolveFunction();
    expect(packagePath).to.equal(rFixture("../..", filename));
  });
}

describe("package.json", () => {
  testResolve("package.json", resolvePackageJSON);

  it("read package.json", async () => {
    const package_ = await readPackageJSON(rFixture("package.json"));
    expect(package_.name).to.equal("foo");
  });

  it("write package.json", async () => {
    await writePackageJSON(rFixture("package.json.tmp"), { version: "1.0.0" });
    expect((await readPackageJSON(rFixture("package.json.tmp"))).version).to.equal("1.0.0");
  });

  it("correctly reads a version from absolute path", async () => {
    expect(await readPackageJSON(rFixture(".")).then(p => p?.version)).to.equal("1.0.0");
  });

  it("correctly reads a version from package", async () => {
    expect(await readPackageJSON("pathe").then(p => p?.version)).to.be.a("string");
  });
});

describe("tsconfig.json", () => {
  testResolve("tsconfig.json", resolveTSConfig);

  it("read tsconfig.json", async () => {
    const tsConfig = await readTSConfig(rFixture("tsconfig.json"));
    expect(tsConfig.compilerOptions?.target).to.equal("ESNext");
  });
  it("write tsconfig.json", async () => {
    await writeTSConfig(rFixture("tsconfig.json.tmp"), { include: ["src"] });
    expect((await readTSConfig(rFixture("tsconfig.json.tmp"))).include).to.deep.equal(["src"]);
  });

  it("strips enums", () => {
    const options: TSConfig["compilerOptions"] = {};
    expectTypeOf(options.moduleResolution).toEqualTypeOf<any>();
    // TODO: type check this file.
    // expectTypeOf(options.maxNodeModuleJsDepth).toEqualTypeOf<number | undefined>()
  });
});

describe("resolveLockfile", () => {
  it("works for subdir", async () => {
    expect(await resolveLockfile(rFixture("./sub"))).to.equal(rFixture("./sub/yarn.lock"));
  });
  it("works for root dir", async () => {
    expect(await resolveLockfile(rFixture("."))).to.equal(rFixture("../..", "pnpm-lock.yaml"));
  });
});

describe("findWorkspaceDir", () => {
  it("works", async () => {
    expect(await findWorkspaceDir(rFixture("./sub"))).to.equal(rFixture("../.."));
    expect(await findWorkspaceDir(rFixture("."))).to.equal(rFixture("../.."));
    expect(await findWorkspaceDir(rFixture(".."))).to.equal(rFixture("../.."));
    expect(await findWorkspaceDir(rFixture("../.."))).to.equal(rFixture("../.."));
  });
});
