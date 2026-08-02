# Changelog

## [1.1.3](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/compare/v1.1.2...v1.1.3) (2026-08-02)


### Bug Fixes

* **release:** restore stack prerequisites ([#83](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/83)) ([23de169](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/23de169f6c9d6a242423646817f855274eb7eaad)), closes [#82](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/82)

## [1.1.2](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/compare/v1.1.1...v1.1.2) (2026-08-02)


### Bug Fixes

* **ci:** call Scorecard directly ([#75](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/75)) ([d09fdb8](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/d09fdb8221a4df93d87a9e30263526da79adf8c9)), closes [#74](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/74)
* **release:** attach SBOM to created release ([#81](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/81)) ([f685143](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/f6851438717d85c2a6da205a387cb5414b2a2ef9)), closes [#80](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/80)

## [1.1.1](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/compare/v1.1.0...v1.1.1) (2026-08-01)


### Bug Fixes

* **inheritance:** inherit foundation bugfix skill ([#64](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/64)) ([a712ad7](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/a712ad7a560a201bb894b28036fa270486b21464))

## [1.1.0](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/compare/v1.0.0...v1.1.0) (2026-07-28)


### Features

* **billing:** Stripe integration with idempotent webhook and unpaid lockout ([8cd7bcb](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/8cd7bcb8c1abc7a1f98663689548c88d8181fc63))
* **billing:** Stripe integration with idempotent webhook and unpaid lockout ([f2a62c4](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/f2a62c4e132da7b6dc117f0d7c58771f7e15c835))
* **identity:** Clerk webhook sync module with system-role seeding ([ad50dfa](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/ad50dfa0590087af556b73abccd03a4921dde366))
* **identity:** restore identity module onto main (recovery 2/2 of PR [#4](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/4)) ([9ead95a](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/9ead95a5dba5de92dc1da8436b683d6b5cbdf9f6))
* **platform:** rate limiting, task queue, and notification ports ([896de9d](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/896de9d76ec176b84aab9217b479df895745b326))
* **platform:** rate limiting, task queue, and notification ports ([47cc485](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/47cc485fe1f5a05b0264e968ea8500768ccd639f))
* **shared:** logging, error taxonomy, RLS-injected prisma client, authz guard ([ca2852d](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/ca2852dc08ea02ee3e50141b6beb25c9956016a4))
* **shared:** restore shared foundation onto main (recovery 1/2 of PR [#3](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/3)) ([d3e0387](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/d3e03879805e28e52d96272bfc82766dd303fded))


### Bug Fixes

* **ci:** authenticate oversized foundation syncs ([#17](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/17)) ([99810a0](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/99810a01b1dd987506c1d73d2bdb3a4a8832ba90))
* **deps:** override vulnerable transitive PostCSS ([#37](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/37)) ([f86f068](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/f86f068f0ec562783a174acebaf04744d8697938))
* **governance:** adopt ruleset-only discovery ([#31](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/31)) ([b4da7b6](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/b4da7b6eb334d0e4b93e552b1c08e3784f1277f2))
* **security:** configure CodeQL language matrix ([#35](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/35)) ([d97668c](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/d97668c59d85838735d25486b6743e75413fd2c4))
* **security:** refresh vulnerable dependencies ([#45](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/45)) ([ade7e23](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/ade7e23934ddb24e4b1a2999790a7071354936bf)), closes [#44](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/44)
* **sync:** adopt safe parent propagation ([#30](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/30)) ([c9e8d85](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/c9e8d85141d52d12c86feb60ad6e6f8f9dc47c1f))
* **sync:** authenticate generated PR provenance ([#21](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/21)) ([5eecc05](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/5eecc05e06d3395080e65ee1a292f149758e16ed))
* **sync:** keep PR body inside workflow script ([#33](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/33)) ([06f62f6](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/06f62f615fe673938c5c1528d8ef03f90f08626d))
* **sync:** resolve full parent source commit ([#23](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/23)) ([dfb87f7](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/dfb87f75183cb1451f6e1629027fb2cd9c359c3f))
* **sync:** use Git pathspec for foundation docs ([#19](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/19)) ([f29a440](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/f29a440ff5b38697d5eb20a6b8155dbc511b6118))
* **template-sync:** protect workflow files ([#12](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/12)) ([c3c6aa8](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/c3c6aa8c26b18993afba399ef7b007fb4f6a7d73))

## 1.0.0 (2026-07-07)


### Features

* **db:** multi-tenant schema with RLS enforced in the database ([243e99b](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/243e99b793c2d10f372800308bdaacaac653a800))
* **db:** multi-tenant schema with RLS enforced in the database ([2d32342](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/2d323427b175f26d454243ec1541e325b86c6f45))
* instantiate Next.js SaaS starter on the ai-dev-foundation base ([0a8343b](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/commit/0a8343b94387efd4c389fbdd021ad50dee5c4b0d))
