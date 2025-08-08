import { fileURLToPath } from "node:url";
import { cp, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "pathe";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { expectTypeOf } from "expect-type";
import {
  type TSConfig,
  type ResolveOptions,
  type PackageJson,
  readPackageJSON,
  readTSConfig,
  resolveTSConfig,
  resolvePackageJSON,
  addPackageJSONDependency,
  removePackageJSONDependency,
  writePackageJSON,
  updatePackageJSON,
  writeTSConfig,
  resolveLockfile,
  findWorkspaceDir,
  // gitconfig
  resolveGitConfig,
  readGitConfig,
  writeGitConfig,
  parseGitConfig,
} from "../src";

const fixtureDir = resolve(dirname(fileURLToPath(import.meta.url)), "fixture");

const rFixture = (...p: string[]) => resolve(fixtureDir, ...p);

const normalizeWinLines = (s: string) => s.replace(/\r\n/g, "\n");

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
    await writePackageJSON(rFixture("package.json.tmp"), { version: "1.0.0" });
    expect(
      (await readPackageJSON(rFixture("package.json.tmp"))).version,
    ).to.equal("1.0.0");
  });

  it("correctly reads a version from absolute path", async () => {
    expect(
      await readPackageJSON(rFixture(".")).then((p) => p?.version),
    ).to.equal("1.0.0");
  });

  it("correctly reads a version from package", async () => {
    expect(await readPackageJSON("pathe").then((p) => p?.version)).to.be.a(
      "string",
    );
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

describe('addPackageJsonDependency', () => {
  let package_: PackageJson;

  beforeEach(async () => {
    package_ = await readPackageJSON(rFixture("package.json"));
  });

  it("can add a production dependency", async () => {
    addPackageJSONDependency(package_, "new-package", "^1.0.0", "prod");
    expect(package_).toEqual({
      "name": "foo",
      "version": "1.0.0",
      "dependencies" :{
        "new-package": "^1.0.0",
      }
    });
  });

  it("can add a development dependency", async () => {
    addPackageJSONDependency(package_, "new-dev-package", "^1.0.0", "dev");
    expect(package_).toEqual({
      "name": "foo",
      "version": "1.0.0",
      "devDependencies" :{
        "new-dev-package": "^1.0.0",
      }
    });
  });

  it("can add an optional dependency", async () => {
    addPackageJSONDependency(package_, "new-optional-package", "^1.0.0", "optional");
    expect(package_).toEqual({
      "name": "foo",
      "version": "1.0.0",
      "optionalDependencies" :{
        "new-optional-package": "^1.0.0",
      }
    });
  });

  it("can add a peer dependency", async () => {
    addPackageJSONDependency(package_, "new-peer-package", "^1.0.0", "peer");
    expect(package_).toEqual({
      "name": "foo",
      "version": "1.0.0",
      "peerDependencies" :{
        "new-peer-package": "^1.0.0",
      }
    });
  });

  it("can add an optional peer dependency", async () => {
    addPackageJSONDependency(package_, "new-optional-peer-package", "^1.0.0", "optionalPeer");
    expect(package_).toEqual({
      "name": "foo",
      "version": "1.0.0",
      "peerDependencies" :{
        "new-optional-peer-package": "^1.0.0",
      },
      "peerDependenciesMeta": {
        "new-optional-peer-package": { optional: true }
      }
    });
  });

  it("sorts dependencies", async () => {
    addPackageJSONDependency(package_, "z-package", "^1.0.0", "prod");
    addPackageJSONDependency(package_, "a-package", "^1.0.0", "prod");
    expect(package_).toEqual({
      "name": "foo",
      "version": "1.0.0",
      "dependencies" :{
        "a-package": "^1.0.0",
        "z-package": "^1.0.0",
      }
    });
  });
});

describe('removePackageJsonDependency', () => {
  let package_: PackageJson;

  beforeEach(async () => {
    package_ = await readPackageJSON(rFixture("package.json"));
  });

  it("can remove a production dependency", async () => {
    package_.dependencies = { "new-package": "^1.0.0" };
    removePackageJSONDependency(package_, "new-package", "prod");
    expect(package_).toEqual({
      "name": "foo",
      "version": "1.0.0",
    });
  });

  it("can remove a development dependency", async () => {
    package_.devDependencies = { "new-dev-package": "^1.0.0" };
    removePackageJSONDependency(package_, "new-dev-package", "dev");
    expect(package_).toEqual({
      "name": "foo",
      "version": "1.0.0",
    });
  });

  it("can remove an optional dependency", async () => {
    package_.optionalDependencies = { "new-optional-package": "^1.0.0" };
    removePackageJSONDependency(package_, "new-optional-package", "optional");
    expect(package_).toEqual({
      "name": "foo",
      "version": "1.0.0",
    });
  });

  it("can remove a peer dependency", async () => {
    package_.peerDependencies = { "new-peer-package": "^1.0.0" };
    removePackageJSONDependency(package_, "new-peer-package", "peer");
    expect(package_).toEqual({
      "name": "foo",
      "version": "1.0.0",
    });
  });

  it("can remove an optional peer dependency", async () => {
    package_.peerDependenciesMeta = { "new-optional-peer-package": { optional: true } };
    package_.peerDependencies = { "new-optional-peer-package": "^1.0.0" };
    removePackageJSONDependency(package_, "new-optional-peer-package", "optionalPeer");
    expect(package_).toEqual({
      "name": "foo",
      "version": "1.0.0",
    });
  });

  it("does not throw when removing non-existent dependencies", async () => {
    expect(() => removePackageJSONDependency(package_, 'non-existent')).not.toThrow();
  });
});

describe('updatePackageJSON', () => {
  let packagePath: string;

  beforeEach(async () => {
    packagePath = rFixture("package.json.tmp");
    await writePackageJSON(packagePath, { name: "test", version: "0.1.0" });
  });

  it("shallow merges non-dependency fields", async () => {
    await writePackageJSON(packagePath, {
      name: "test",
      version: "0.1.0",
      scripts: {
        build: "tsc"
      }
    });
    await updatePackageJSON(packagePath, {
      scripts: {
        test: "vitest"
      }
    });
    expect(
      JSON.parse(await readFile(packagePath, 'utf8'))
    ).toEqual({
      name: "test",
      version: "0.1.0",
      scripts: {
        test: "vitest"
      }
    });
  });
});
