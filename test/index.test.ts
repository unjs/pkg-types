import { fileURLToPath } from "node:url";
import { cp, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { dirname, join, resolve } from "pathe";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { expectTypeOf } from "expect-type";
import {
  type TSConfig,
  type ResolveOptions,
  type PackageJson,
  readPackageJSON,
  readTSConfig,
  resolveTSConfig,
  resolvePackageJSON,
  writePackageJSON,
  updatePackage,
  normalizePackage,
  writeTSConfig,
  resolveLockfile,
  findWorkspaceDir,
  // gitconfig
  resolveGitConfig,
  readGitConfig,
  writeGitConfig,
  parseGitConfig,
  // unified package functions
  findPackage,
  readPackage,
  writePackage,
  sortPackage,
} from "../src";
import { tmpdir } from "node:os";

const fixtureDir = resolve(dirname(fileURLToPath(import.meta.url)), "fixture");

const rFixture = (...p: string[]) => resolve(fixtureDir, ...p);

const normalizeWinLines = (s: string) => s.replace(/\r\n/g, "\n");

const createTempFixtureDir = async (): Promise<string> => {
  const path = await mkdtemp(join(tmpdir(), "pkg-types"));
  await mkdir(path, { recursive: true });
  return path;
};

async function expectToReject(p: Promise<any>) {
  return expect(
    await p.then(() => {}).catch((error: Error) => error.toString()),
  );
}

function testResolve(
  filename: string,
  resolveFunction: (
    id?: string,
    options?: ResolveOptions,
  ) => Promise<string | null>,
) {
  it("finds a package.json in root directory", async () => {
    const packagePath = await resolveFunction(rFixture("."));
    expect(packagePath).to.equal(rFixture(filename));
  });
  it("finds package.json from root", async () => {
    const packagePath = await resolveFunction(rFixture("."), { reverse: true });
    expect(packagePath).to.equal(rFixture("../..", filename)); // Top level in pkg-types repo
  });
  it("handles non-existent paths", async () => {
    const packagePath = await resolveFunction(
      rFixture("further", "dir", "file.json"),
    );
    expect(packagePath).to.equal(rFixture(filename));
  });
  it("works all the way up the tree", async () => {
    (
      await expectToReject(resolveFunction("/a/full/nonexistent/path"))
    ).to.contain("Cannot find matching");
  });
  it("stops at `node_modules`", async () => {
    (
      await expectToReject(
        resolveFunction(rFixture("further", "node_modules", "file.json")),
      )
    ).to.contain("Cannot find matching");
  });
  it("finds the working directory", async () => {
    const packagePath = await resolveFunction();
    expect(packagePath).to.equal(rFixture("../..", filename));
  });
}

describe("package.json", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempFixtureDir();
  });

  afterEach(async () => {
    await rm(tempDir, { force: true, recursive: true });
  });

  testResolve("package.json", resolvePackageJSON);

  it("read package.json", async () => {
    const package_ = await readPackageJSON(rFixture("package.json"));
    expect(package_.name).to.equal("foo");
  });

  it("read package.json (jsonc)", async () => {
    const package_ = await readPackageJSON(rFixture("jsonc/package.json"));
    expect(package_.name).to.equal("foo");
  });

  it("write package.json", async () => {
    await writePackageJSON(join(tempDir, "package.json"), { version: "1.0.0" });
    expect(
      (await readPackageJSON(join(tempDir, "package.json"))).version,
    ).to.equal("1.0.0");
  });

  it("correctly reads a version from absolute path", async () => {
    expect(
      await readPackageJSON(rFixture(".")).then((p) => p?.version),
    ).to.equal("1.0.0");
  });

  it("correctly reads a version from package", async () => {
    const package_ = await readPackageJSON("pathe");
    expect(package_.name).to.equal("pathe");
    expect(package_.version).to.be.a("string");
  });

  it("styles are preserved", async () => {
    const originalContent = await readFile(
      rFixture("package.json"),
      "utf8",
    ).then(normalizeWinLines);
    await writePackageJSON(
      rFixture("package.json") + ".tmp",
      await readPackageJSON(rFixture("package.json")),
    );
    const newContent = await readFile(
      rFixture("package.json") + ".tmp",
      "utf8",
    ).then(normalizeWinLines);
    expect(newContent).toBe(originalContent);
  });
});

describe("package.{json,jsonc,json5}", () => {
  it("finds any package file", async () => {
    const packagePath = await findPackage(rFixture("."));
    expect(packagePath).to.equal(rFixture("package.json"));
  });

  it("reads package.json", async () => {
    const package_ = await readPackage(rFixture("package.json"));
    expect(package_.name).to.equal("foo");
  });

  it("reads package.json with comments (JSONC)", async () => {
    const package_ = await readPackage(rFixture("jsonc/package.json"));
    expect(package_.name).to.equal("foo");
  });

  it("reads package.json5", async () => {
    const package_ = await readPackage(rFixture("package.json5"));
    expect(package_.name).to.equal("foo");
    expect(package_.version).to.equal("1.0.0");
  });

  it("reads package.yaml", async () => {
    const package_ = await readPackage(rFixture("package.yaml"));
    expect(package_.name).to.equal("foo");
    expect(package_.version).to.equal("1.0.0");
  });

  it("writes package.json", async () => {
    await writePackage(rFixture("package.json.tmp"), { version: "1.0.0" });
    expect((await readPackage(rFixture("package.json.tmp"))).version).to.equal(
      "1.0.0",
    );
  });

  it("writes package.json5", async () => {
    await writePackage(rFixture("package.json5.tmp"), {
      name: "foo",
      version: "1.0.0",
    });
    expect((await readPackage(rFixture("package.json5.tmp"))).name).to.equal(
      "foo",
    );
  });

  it("writes package.yaml", async () => {
    await writePackage(rFixture("package.yaml.tmp"), {
      name: "foo",
      version: "1.0.0",
    });
    expect((await readPackage(rFixture("package.yaml.tmp"))).name).to.equal(
      "foo",
    );
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
    expect(
      (await readTSConfig(rFixture("tsconfig.json.tmp"))).include,
    ).to.deep.equal(["src"]);
  });

  it("strips enums", () => {
    const options: TSConfig["compilerOptions"] = {};
    expectTypeOf(options.moduleResolution).toEqualTypeOf<any>();
    // TODO: type check this file.
    // expectTypeOf(options.maxNodeModuleJsDepth).toEqualTypeOf<number | undefined>()
  });

  it("styles are preserved", async () => {
    const originalContent = await readFile(
      rFixture("tsconfig.json"),
      "utf8",
    ).then(normalizeWinLines);
    await writeTSConfig(
      rFixture("tsconfig.json") + ".tmp",
      await readTSConfig(rFixture("tsconfig.json")),
    );
    const newContent = await readFile(
      rFixture("tsconfig.json") + ".tmp",
      "utf8",
    ).then(normalizeWinLines);
    expect(newContent).toBe(originalContent.replace(/\s*\/\/\s*.+/g, ""));
  });
});

describe("resolveLockfile", () => {
  it("works for subdir", async () => {
    expect(await resolveLockfile(rFixture("./sub"))).to.equal(
      rFixture("./sub/yarn.lock"),
    );
  });
  it("works for root dir", async () => {
    expect(await resolveLockfile(rFixture("."))).to.equal(
      rFixture("../..", "pnpm-lock.yaml"),
    );
  });
});

describe("findWorkspaceDir", () => {
  it("works", async () => {
    expect(await findWorkspaceDir(rFixture("./sub"))).to.equal(
      rFixture("../.."),
    );
    expect(await findWorkspaceDir(rFixture("."))).to.equal(rFixture("../.."));
    expect(await findWorkspaceDir(rFixture(".."))).to.equal(rFixture("../.."));
    expect(await findWorkspaceDir(rFixture("../.."))).to.equal(
      rFixture("../.."),
    );
  });

  it("detects Deno workspace", async () => {
    expect(await findWorkspaceDir(rFixture("deno"))).to.equal(rFixture("deno"));
    expect(await findWorkspaceDir(rFixture("deno/packages/foo"))).to.equal(
      rFixture("deno"),
    );
  });
});

describe(".git/config", () => {
  beforeAll(async () => {
    await rm(rFixture(".git"), { force: true, recursive: true });
    await cp(rFixture("_git"), rFixture(".git"), {
      recursive: true,
    });
  });

  afterAll(async () => {
    await rm(rFixture(".git"), { force: true, recursive: true });
  });

  it("resolveGitConfig", async () => {
    expect(await resolveGitConfig(rFixture("."))).to.equal(
      rFixture(".git/config"),
    );
  });

  it("readGitConfig", async () => {
    expect(await readGitConfig(rFixture("."))).toMatchObject({
      core: {
        bare: false,
        filemode: true,
        ignorecase: true,
        logallrefupdates: true,
        precomposeunicode: true,
        repositoryformatversion: "0",
      },
      branch: {
        develop: {
          merge: "refs/heads/develop",
          remote: "origin",
        },
        main: {
          merge: "refs/heads/main",
          remote: "origin",
        },
      },
      remote: {
        origin: {
          fetch: "+refs/heads/*:refs/remotes/origin/*",
          url: "https://github.com/username/repo.git",
        },
      },
    });
  });

  it("writeGitConfig", async () => {
    const fixtureConfigINI = await readFile(rFixture(".git/config"), "utf8");

    await writeGitConfig(
      rFixture(".git/config.tmp"),
      parseGitConfig(fixtureConfigINI),
    );

    const newConfigINI = await readFile(rFixture(".git/config.tmp"), "utf8");

    expect(newConfigINI.trim()).toBe(fixtureConfigINI.trim());
  });
});

describe("updatePackage", () => {
  let packagePath: string;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempFixtureDir();
    packagePath = join(tempDir, "package.json");
    await writePackageJSON(packagePath, { name: "test", version: "0.1.0" });
  });

  afterEach(async () => {
    await rm(tempDir, { force: true, recursive: true });
  });

  it("applies sync callbacks", async () => {
    await updatePackage(tempDir, (pkg) => {
      pkg.version = "0.2.0";
    });
    const updatedPackage = await readPackageJSON(packagePath);
    expect(updatedPackage.version).to.equal("0.2.0");
  });

  it("applies async callbacks", async () => {
    await updatePackage(tempDir, async (pkg) => {
      pkg.version = "0.3.0";
    });
    const updatedPackage = await readPackageJSON(packagePath);
    expect(updatedPackage.version).to.equal("0.3.0");
  });

  it("auto-creates dependency fields", async () => {
    await updatePackage(tempDir, (pkg) => {
      pkg.dependencies = { "new-package": "^1.0.0" };
    });
    const updatedPackage = await readPackageJSON(packagePath);
    expect(updatedPackage.dependencies).toEqual({
      "new-package": "^1.0.0",
    });
  });
});

describe("normalizePackage", () => {
  it("returns package object", () => {
    const input: PackageJson = {
      name: "foo",
      version: "1.0.0",
      description: "A test package",
    };
    const package_ = normalizePackage(input);
    expect(package_).toEqual(input);
  });

  it("sorts dependencies", () => {
    const input: PackageJson = {
      name: "foo",
      version: "1.0.0",
      dependencies: {
        "z-package": "^1.0.0",
        "a-package": "^1.0.0",
      },
    };
    const package_ = normalizePackage(input);
    expect(package_.dependencies).toEqual({
      "a-package": "^1.0.0",
      "z-package": "^1.0.0",
    });
  });

  it("sorts devDependencies", () => {
    const input: PackageJson = {
      name: "foo",
      version: "1.0.0",
      devDependencies: {
        "z-dev-package": "^1.0.0",
        "a-dev-package": "^1.0.0",
      },
    };
    const package_ = normalizePackage(input);
    expect(package_.devDependencies).toEqual({
      "a-dev-package": "^1.0.0",
      "z-dev-package": "^1.0.0",
    });
  });

  it("sorts optionalDependencies", () => {
    const input: PackageJson = {
      name: "foo",
      version: "1.0.0",
      optionalDependencies: {
        "z-optional-package": "^1.0.0",
        "a-optional-package": "^1.0.0",
      },
    };
    const package_ = normalizePackage(input);
    expect(package_.optionalDependencies).toEqual({
      "a-optional-package": "^1.0.0",
      "z-optional-package": "^1.0.0",
    });
  });

  it("sorts peerDependencies", () => {
    const input: PackageJson = {
      name: "foo",
      version: "1.0.0",
      peerDependencies: {
        "z-peer-package": "^1.0.0",
        "a-peer-package": "^1.0.0",
      },
    };
    const package_ = normalizePackage(input);
    expect(package_.peerDependencies).toEqual({
      "a-peer-package": "^1.0.0",
      "z-peer-package": "^1.0.0",
    });
  });

  it("sorts scripts", () => {
    const input: PackageJson = {
      name: "foo",
      version: "1.0.0",
      scripts: {
        "z-script": "echo z",
        "a-script": "echo a",
      },
    };
    const package_ = normalizePackage(input);
    expect(package_.scripts).toEqual({
      "a-script": "echo a",
      "z-script": "echo z",
    });
  });

  it("removes invalid dependency objects", () => {
    const input: PackageJson = {
      name: "foo",
      version: "1.0.0",
      dependencies: 303 as never,
    };
    const package_ = normalizePackage(input);
    expect(package_).toEqual({
      name: "foo",
      version: "1.0.0",
    });
  });
});

describe("sortPackage", () => {
  it("should sort top-level fields", () => {
    const input: PackageJson = {
      dependencies: { bar: "^1.0.0" },
      description: "A test package",
      name: "foo",
      scripts: { build: "echo build" },
      version: "1.0.0",
    };
    const sortedPackage = sortPackage(input);
    expect(Object.keys(sortedPackage)).toEqual([
      "name",
      "version",
      "description",
      "scripts",
      "dependencies",
    ]);
  });

  it("should sort nested keys", () => {
    const input: PackageJson = {
      dependencies: { b: "1", a: "1", c: "1" },
    };
    const sortedPackage = sortPackage(input);
    expect(Object.keys(sortedPackage.dependencies!)).toEqual(["a", "b", "c"]);
  });

  it("should retain order of unknown keys", () => {
    const input: PackageJson = {
      customField0: "customValue",
      version: "1.0.0",
      name: "foo",
      description: "A test package",
      customField1: "customValue",
      dependencies: { bar: "^1.0.0" },
    };
    const sortedPackage = sortPackage(input);
    expect(Object.keys(sortedPackage)).toEqual([
      "customField0",
      "name",
      "version",
      "description",
      "customField1",
      "dependencies",
    ]);
  });
});
