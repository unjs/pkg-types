# pkg-types

> Node.js utilities and TypeScript definitions for `package.json` and `tsconfig.json`

```
＼⍩⃝／
```

## Install

```sh
# npm
npm i pkg-types

# yarn
yarn add pkg-types

# pnpm
pnpm add pkg-types
```

## Usage

### `readPackageJSON`

```js
import { readPackageJSON } from 'pkg-types'
const localPackageJson = await readPackageJSON()
// or
const packageJson = await readPackageJSON('/fully/resolved/path/to/folder')
```

### `writePackageJSON`

```js
import { writePackageJSON } from 'pkg-types'

await writePackageJSON('path/to/package.json', pkg)
```

### `resolvePackageJSON`

```js
import { resolvePackageJSON } from 'pkg-types'
const filename = await resolvePackageJSON()
// or
const packageJson = await resolvePackageJSON('/fully/resolved/path/to/folder')
```

### `readTSConfig`

```js
import { readTSConfig } from 'pkg-types'
const tsconfig = await readTSConfig()
// or
const tsconfig = await readTSConfig('/fully/resolved/path/to/folder')
```

### `writeTSConfig`

```js
import { writeTSConfig } from 'pkg-types'

await writeTSConfig('path/to/tsconfig.json', tsconfig)
```

### `resolveTSConfig`

```js
import { resolveTSConfig } from 'pkg-types'
const filename = await resolveTSConfig()
// or
const tsconfig = await resolveTSConfig('/fully/resolved/path/to/folder')
```

### `resolveFile`

```js
import { resolveFile } from 'pkg-types'
const filename = await resolveFile('README.md', {
  startingFrom: id,
  rootPattern: /^node_modules$/,
  matcher: filename => filename.endsWith('.md'),
})
```

### `resolveLockFile`

Find path to the lock file (`yarn.lock`, `package-lock.json`, `pnpm-lock.yaml`, `npm-shrinkwrap.json`) or throws an error.

```js
import { resolveLockFile } from 'pkg-types'
const lockfile = await resolveLockFile('.')
```

### `findWorkspaceDir`

Try to detect workspace dir by in order:

1. Nearest `.git` directory
2. Farthest lockfile
3. Farthest `package.json` file

If fails, throws an error.

```js
import { findWorkspaceDir } from 'pkg-types'
const workspaceDir = await findWorkspaceDir('.')
```

### `resolveWorkspace`

Find monorepo workspace config (support: `pnpm`, `yarn`, `npm`, `lerna`), will return `root` path, `type` of monorepo manager, `workspaces` config.

If fails, throws an error.

```js
import { resolveWorkspace } from 'pkg-types'
const {
  root,
  type,
  workspaces,
} = await resolveWorkspace('.')
```

### `resolveWorkspacePkgs`

Find monorepo workspace packages and read each package `package.json`

```js
import { resolveWorkspacePkgs } from 'pkg-types'
const { type, root, packages } = await resolveWorkspacePkgs('.')
console.log(root) // { dir: 'fully/resolved/root/path', packageJson: { ... } }
console.log(packages) // [ { dir: 'fully/resolved/foo/path', packageJson: { ... } } ]
```

### `resolveWorkspacePkgsGraph`

Find monorepo workspace packages graph sort by `devDependency` and `dependency`

```js
import { resolveWorkspacePkgsGraph } from 'pkg-types'
const pkgsGraph = await resolveWorkspacePkgsGraph('.')
console.log(pkgsGraph) // [['foo'], ['bar']]
```

## Types

**Note:** In order to make types working, you need to install `typescript` as a devDependency.

You can directly use typed interfaces:

```ts
import type { TSConfig, PackageJSON } from 'pkg-types'
```

You can also use define utils for type support for using in plain `.js` files and auto-complete in IDE.

```js
import type { definePackageJSON } from 'pkg-types'

const pkg = definePackageJSON({})
```

```js
import type { defineTSConfig } from 'pkg-types'

const pkg = defineTSConfig({})
```

## Alternatives

- [dominikg/tsconfck](https://github.com/dominikg/tsconfck)

## License

MIT - Made with 💛
