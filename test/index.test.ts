import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { expect } from 'chai'
import { expectTypeOf } from 'expect-type'
import {
  readPackageJSON,
  writePackageJSON,
  readTSConfig,
  writeTSConfig,
  TSConfig
} from '../src'


const fixtureDir = resolve(dirname(fileURLToPath(import.meta.url)), 'fixture')

const rFixture = (...p: string[]) => resolve(fixtureDir, ...p)

describe('package.json', () => {
  it('read package.json', async () => {
    const pkg = await readPackageJSON(rFixture('package.json'))
    expect(pkg.name).to.equal('foo')
  })
  it('write package.json', async () => {
    const pkg = await writePackageJSON(rFixture('package.json.tmp'), { version: '1.0.0' })
    expect((await readPackageJSON(rFixture('package.json.tmp'))).version).to.equal('1.0.0')
  })
})

describe('tsconfig.json', () => {
  it('read tsconfig.json', async () => {
    const tsConfig = await readTSConfig(rFixture('tsconfig.json'))
    expect(tsConfig.compilerOptions?.target).to.equal('ESNext')
  })
  it('write tsconfig.json', async () => {
    const tsConfig = await writeTSConfig(rFixture('tsconfig.json.tmp'), { include: ['foo'] })
    expect((await readTSConfig(rFixture('tsconfig.json.tmp'))).include).to.deep.equal(['foo'])
  })
})


describe.skip('tsconfig types', () => {
  it('strips enums', () => {
    const options: TSConfig['compilerOptions'] = {}
    expectTypeOf(options.moduleResolution).toEqualTypeOf<any>()
    // TODO: type check this file.
    // expectTypeOf(options.maxNodeModuleJsDepth).toEqualTypeOf<number | undefined>()
  })
})
