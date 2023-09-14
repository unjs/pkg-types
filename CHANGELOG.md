# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## v1.0.3

[compare changes](https://undefined/undefined/compare/v1.0.2...v1.0.3)


### 🩹 Fixes

  - Add `exports.types` field (#120)

### 📖 Documentation

  - Remove duplicate usage in readme (#115)

### 🤖 CI

  - Remove lint workflow from matrix (a5a00af)
  - Revert to node 16 (f6cb62c)

### ❤️  Contributors

- Daniel Roe <daniel@roe.dev>
- Saman Hosseini <bounoable@gmail.com>
- Ʀᴀʏ ([@so1ve](http://github.com/so1ve))

## v1.0.2


### 🩹 Fixes

  - Resolve paths with `pathe` (#72)

### 📖 Documentation

  - Remove duplicate section (#96)

### 🏡 Chore

  - Add @danielroe to license (648f7c5)
  - Switch to changelogen for release (489eba0)
  - Update mlly (6b7b8fa)

### 🎨 Styles

  - Lint with prettier (d74afab)

### ❤️  Contributors

- Pooya Parsa <pooya@pi0.io>
- ZhangZhiChao 
- Lxxyx <Lxxyxzj@gmail.com>

### [1.0.1](https://github.com/unjs/pkg-types/compare/v1.0.0...v1.0.1) (2022-11-14)

## [1.0.0](https://github.com/unjs/pkg-types/compare/v0.3.6...v1.0.0) (2022-11-14)


### Features

* allow caching `readPackageJSON` and `readTSConfig` ([#47](https://github.com/unjs/pkg-types/issues/47)) ([ca127d0](https://github.com/unjs/pkg-types/commit/ca127d0600010c66d3f4d072f109730500e16923))

### [0.3.6](https://github.com/unjs/pkg-types/compare/v0.3.5...v0.3.6) (2022-10-26)


### Features

* detect bun lockfiles ([#57](https://github.com/unjs/pkg-types/issues/57)) ([7619c79](https://github.com/unjs/pkg-types/commit/7619c793af5e965616ba97639917accb839eeefc))


### Bug Fixes

* `readPackageJSON` and `readPackageJSON` can be called without id ([#39](https://github.com/unjs/pkg-types/issues/39)) ([1b149ef](https://github.com/unjs/pkg-types/commit/1b149ef98dca4f7306f6276f8214ff85edc720d8))

### [0.3.5](https://github.com/unjs/pkg-types/compare/v0.3.4...v0.3.5) (2022-09-06)


### Features

* `findFarthestFile` ([#32](https://github.com/unjs/pkg-types/issues/32)) ([0d8319e](https://github.com/unjs/pkg-types/commit/0d8319e2f90fcfe38447730c70deb2437c16e688))
* `findWorkspaceDir` ([#34](https://github.com/unjs/pkg-types/issues/34)) ([8b53c08](https://github.com/unjs/pkg-types/commit/8b53c0802cdd119beebc563d5fc791248391ccb7))
* add `resolveLockfile` ([#14](https://github.com/unjs/pkg-types/issues/14)) ([6b12948](https://github.com/unjs/pkg-types/commit/6b12948ae3ea29972b3f365047cba695ad322c4f))

### [0.3.4](https://github.com/unjs/pkg-types/compare/v0.3.3...v0.3.4) (2022-08-18)


### Bug Fixes

* **types:** rename `licence` to `license` ([#17](https://github.com/unjs/pkg-types/issues/17)) ([ddda0b5](https://github.com/unjs/pkg-types/commit/ddda0b509a715f26e8d0d7e73a5b58922ee6bfb4))

### [0.3.3](https://github.com/unjs/pkg-types/compare/v0.3.2...v0.3.3) (2022-06-20)


### Bug Fixes

* add missing `scripts` key and allow extensibility ([#11](https://github.com/unjs/pkg-types/issues/11)) ([453d375](https://github.com/unjs/pkg-types/commit/453d37512ba9d562457671574324cdfc2264fdcf))

### [0.3.2](https://github.com/unjs/pkg-types/compare/v0.3.1...v0.3.2) (2021-11-30)


### Features

* allow passing find options to resolvers ([9835524](https://github.com/unjs/pkg-types/commit/9835524d86f539473d0cfadeeabc09c567a41b87))

### [0.3.1](https://github.com/unjs/pkg-types/compare/v0.3.0...v0.3.1) (2021-10-27)


### Bug Fixes

* **pkg:** run prepare before publish ([a8c79fc](https://github.com/unjs/pkg-types/commit/a8c79fc85430be3a98863429bdce494923f82cb6))

## [0.3.0](https://github.com/unjs/pkg-types/compare/v0.2.3...v0.3.0) (2021-10-27)


### ⚠ BREAKING CHANGES

* improve resolving (#4)

### Features

* improve resolving ([#4](https://github.com/unjs/pkg-types/issues/4)) ([da4567f](https://github.com/unjs/pkg-types/commit/da4567f9fac680e9ce0ad1e9428da721cf4f8b7f))

### [0.2.3](https://github.com/unjs/pkg-types/compare/v0.2.2...v0.2.3) (2021-10-26)

### [0.2.2](https://github.com/unjs/pkg-types/compare/v0.2.1...v0.2.2) (2021-10-26)


### Features

* add `readNearest*` and `findNearest*` utilities ([#3](https://github.com/unjs/pkg-types/issues/3)) ([fe5997e](https://github.com/unjs/pkg-types/commit/fe5997eac05c4d02697b99fa86fd60a0ff8e6040))

### [0.2.1](https://github.com/unjs/pkg-types/compare/v0.2.0...v0.2.1) (2021-10-18)


### Bug Fixes

* **pkg:** update package.json ([cd12484](https://github.com/unjs/pkg-types/commit/cd124848a2c41950aeec3db0bca772b43e51e629))

## [0.2.0](https://github.com/unjs/pkg-types/compare/v0.1.5...v0.2.0) (2021-10-14)


### ⚠ BREAKING CHANGES

* use jsonc parser

### Features

* use jsonc parser ([5aa9b1a](https://github.com/unjs/pkg-types/commit/5aa9b1a3e16e09898f197d1aecc6359b6454e825))

### [0.1.5](https://github.com/unjs/pkg-types/compare/v0.1.4...v0.1.5) (2021-10-14)

### [0.1.4](https://github.com/unjs/pkg-types/compare/v0.1.2...v0.1.4) (2021-10-14)


### Features

* add `package.json` type ([8c5dfca](https://github.com/unjs/pkg-types/commit/8c5dfca38ebd7372a45cb99cc748fe4415f6aec4))
* add runtime utilities ([37c5ab1](https://github.com/unjs/pkg-types/commit/37c5ab105e47cb74f271fa2480e478549fac2c49))


### Bug Fixes

* default to any (resolves key signature issue) ([a0563e4](https://github.com/unjs/pkg-types/commit/a0563e4fe9d19154add2255003dbd50cb27cefee))
* prevent TS enums from polluting type ([403686d](https://github.com/unjs/pkg-types/commit/403686d6cf4899228e7b5391591c99b3644b7b47))

### [0.1.3](https://github.com/unjs/pkg-types/compare/v0.1.2...v0.1.3) (2021-10-13)


### Features

* add `package.json` type ([8c5dfca](https://github.com/unjs/pkg-types/commit/8c5dfca38ebd7372a45cb99cc748fe4415f6aec4))


### Bug Fixes

* default to any (resolves key signature issue) ([a0563e4](https://github.com/unjs/pkg-types/commit/a0563e4fe9d19154add2255003dbd50cb27cefee))
* prevent TS enums from polluting type ([403686d](https://github.com/unjs/pkg-types/commit/403686d6cf4899228e7b5391591c99b3644b7b47))

### [0.1.2](https://github.com/unjs/pkg-types/compare/v0.1.1...v0.1.2) (2021-10-13)


### Bug Fixes

* fix types field ([6b38f27](https://github.com/unjs/pkg-types/commit/6b38f2721cfd621811f776430708462535bfc7aa))

### 0.1.1 (2021-10-13)
