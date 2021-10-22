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
```

## Usage

### `readPackageJSON`

```js
import { readPackageJSON } from 'pkg-types'

const pkg = await readPackageJSON('path/to/package.json')
```

### `writePackageJSON`

```js
import { writePackageJSON } from 'pkg-types'

await writePackageJSON('path/to/package.json', pkg)
```

### `findNearestPackageJSON`

```js
import { findNearestPackageJSON } from 'pkg-types'
const filename = findNearestPackageJSON()
// or
const packageJson = findNearestPackageJSON('/fully/resolved/path/to/folder')
```

### `readNearestPackageJSON`

```js
import { readNearestPackageJSON } from 'pkg-types'
const filename = await readNearestPackageJSON()
// or
const packageJson = await readNearestPackageJSON('/fully/resolved/path/to/folder')
```

### `readTSConfig`

```js
import { readTSConfig } from 'pkg-types'

const pkg = await readTSConfig('path/to/tsconfig.json')
```

### `writeTSConfig`

```js
import { writeTSConfig } from 'pkg-types'

await writeTSConfig('path/to/tsconfig.json', tsconfig)
```

### `findNearestTSConfig`

```js
import { findNearestTSConfig } from 'pkg-types'
const filename = findNearestTSConfig()
// or
const tsconfig = findNearestTSConfig('/fully/resolved/path/to/folder')
```

### `readNearestTSConfig`

```js
import { readNearestTSConfig } from 'pkg-types'
const filename = await readNearestTSConfig()
// or
const tsconfig = await readNearestTSConfig('/fully/resolved/path/to/folder')
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
