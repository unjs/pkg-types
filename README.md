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

Usage documentation is available within TSdocs within your IDE or by inspecting the source code.

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
