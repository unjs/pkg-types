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


## License

MIT - Made with 💛
