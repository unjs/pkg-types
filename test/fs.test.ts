import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { expect } from 'chai'
import {
  readNearestPackageJSON,
  readNearestTSConfig,
  findNearestPackageJSON,
  findNearestTSConfig,
  PackageJson,
  TSConfig,
} from '../src'


const fixtureDir = resolve(dirname(fileURLToPath(import.meta.url)), 'fixture')

const rFixture = (...p: string[]) => resolve(fixtureDir, ...p)

const tests = {
  'tsconfig.json': [readNearestTSConfig, findNearestTSConfig],
  'package.json': [readNearestPackageJSON, findNearestPackageJSON]
} as const
for (const filename in tests) {
  const [read, find] = tests[filename as 'tsconfig.json']
  describe(find.name, () => {
    it('finds a package.json in root directory', async () => {
      const pkgPath = await find(rFixture('.'))
      expect(pkgPath).to.equal(rFixture(filename))
    })
    it('handles non-existent paths', async () => {
      const pkgPath = await find(rFixture('further', 'dir', 'file.json'))
      expect(pkgPath).to.equal(rFixture(filename))
    })
    it('works all the way up the tree', async () => {
      const pkgPath = await find('/a/full/nonexistent/path')
      expect(pkgPath).to.equal(null)
    })
    it('stops at `node_modules`', async () => {
      const pkgPath = await find(rFixture('further', 'node_modules', 'file.json'))
      expect(pkgPath).to.equal(null)
    })
    it(`finds the working directory ${filename}`, async () => {
      const pkgPath = await find()
      expect(pkgPath).to.equal(rFixture('../..', filename))
    })
  })

  describe(read.name, () => {
    it('correctly reads a package', async () => {
      const data = await read(rFixture(filename))
      if (filename === 'package.json') {
        expect((data as PackageJson).name).to.equal('foo')
      } else {
        expect((data as TSConfig).include).to.contain('src')
      }
    })
  })
}
