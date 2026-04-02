# Changelog

## [1.3.0](https://github.com/boxcee/forge-flux-deployments/compare/forge-flux-deployments-v1.2.0...forge-flux-deployments-v1.3.0) (2026-04-02)


### Features

* **01-01:** migrate site config to just-the-docs with sidebar navigation ([5cbf25d](https://github.com/boxcee/forge-flux-deployments/commit/5cbf25d75271a02c8becbd480707c906624c83df))
* **01-01:** rewrite index.md as feature showcase home page ([2a977ea](https://github.com/boxcee/forge-flux-deployments/commit/2a977ea5879c363dbe00440d44a71835f87e264c))
* **03-01:** enhance privacy policy with Marketplace-required sections ([852e410](https://github.com/boxcee/forge-flux-deployments/commit/852e41000bb43c0daae2a8edeacb506f79718a3c))
* **03-01:** enhance terms of service with Marketplace-required sections ([653fad9](https://github.com/boxcee/forge-flux-deployments/commit/653fad9d4ea7279003b0c7abfe54f941d62a2a18))
* **03-02:** add complete Privacy & Security tab answers and update legal URLs ([722de3c](https://github.com/boxcee/forge-flux-deployments/commit/722de3c815419ac676bb070ed0010534ccb0fb8b))
* **04-01:** fix listing accuracy and add icon reference ([a0f17a2](https://github.com/boxcee/forge-flux-deployments/commit/a0f17a2b398d00fab76eee9b8ea08dd0b025b70f))
* **05-01:** add Forge resolver with input validation and 6 handlers ([41f3816](https://github.com/boxcee/forge-flux-deployments/commit/41f38168637ef9ebbdfefa16ebaca9de94359d44))
* **05-01:** add storage abstraction layer with KVS and env var fallback ([7f3ed43](https://github.com/boxcee/forge-flux-deployments/commit/7f3ed43659d3da1ce9288d740bde8fba1e597c31))
* **05-02:** add admin page UI and wire manifest ([9472c82](https://github.com/boxcee/forge-flux-deployments/commit/9472c8242069b8a77b9d19b08e3f5c71c2ac131e))
* **05-02:** migrate handlers from env vars to storage.js ([073acb6](https://github.com/boxcee/forge-flux-deployments/commit/073acb68883108b51b2814408d8a0d3ed2a1de54))
* **07-01:** create event-log SQL module with @forge/sql ([749fd7e](https://github.com/boxcee/forge-flux-deployments/commit/749fd7e76e4a9adf508321cd372ad13dd0af701a))
* **07-02:** add resolver handlers and update tests for event log ([22aeba8](https://github.com/boxcee/forge-flux-deployments/commit/22aeba8b0b94f05a3bc7b5ffbf4c34c55170b238))
* **07-02:** wire event log into handlers and manifest ([5ad5236](https://github.com/boxcee/forge-flux-deployments/commit/5ad52365148a85f87f5be3859e0d131dd09ba411))
* **08-01:** add tabbed layout to admin page ([268571e](https://github.com/boxcee/forge-flux-deployments/commit/268571ef50826c311f2efc4da9b56cc4b0826ece))
* **08-01:** build EventLogPanel with stats, table, filtering, pagination ([6e9f71a](https://github.com/boxcee/forge-flux-deployments/commit/6e9f71a42d9a843b6a561c9e4d8d9db92beb3e8b))
* add ArgoCD mapper for deployment payload building ([b448445](https://github.com/boxcee/forge-flux-deployments/commit/b448445c4c28cbf4f8f2a42facceb5c27b4fb129))
* add ArgoCD webtrigger, function, and deployment provider to manifest ([5b93828](https://github.com/boxcee/forge-flux-deployments/commit/5b93828d967be4c4225eb80d97e8db03ba59027c))
* add bearer token auth module for ArgoCD webhooks ([ae036c0](https://github.com/boxcee/forge-flux-deployments/commit/ae036c0af3ff02b8a7209278131626c02695e68e))
* add handleArgoEvent handler with bearer token auth ([ec3a983](https://github.com/boxcee/forge-flux-deployments/commit/ec3a983c51c9aec9f74d569cf14c4bfed10487e4))
* add HMAC signature verification module ([87c5f4b](https://github.com/boxcee/forge-flux-deployments/commit/87c5f4bf5a80827b8ad20be578bb937aabbfc5b2))
* add Jira deployment payload builder ([af5f3e8](https://github.com/boxcee/forge-flux-deployments/commit/af5f3e8db684b2aaddd20c7c34f1145709779a20))
* add Jira Deployments API client module ([89af24e](https://github.com/boxcee/forge-flux-deployments/commit/89af24e163199ed4f5fa90ed8d8eee9a20aec0ad))
* add metadata extraction from FluxCD events ([cd3e23c](https://github.com/boxcee/forge-flux-deployments/commit/cd3e23c2614d7f83b314f7a4ff7c01bde726f283))
* add reason-to-state mapping ([8afa572](https://github.com/boxcee/forge-flux-deployments/commit/8afa572d16dec58b1077d33634979e1df6e2270b))
* add test fixtures and manual test script ([5a91a02](https://github.com/boxcee/forge-flux-deployments/commit/5a91a02545a0f0e432b84a6ebf1694dcfa8d1f51))
* scaffold Forge app with manifest and dependencies ([bcec591](https://github.com/boxcee/forge-flux-deployments/commit/bcec591d068d803fc7d1964b66fb606757a47d52))
* wire handler — HMAC, parsing, mapping, Jira submission ([bbd5b64](https://github.com/boxcee/forge-flux-deployments/commit/bbd5b6487f76e2077f143098377b679fb37181e0))


### Bug Fixes

* **05-02:** add error handling to admin page invoke calls ([3b81be9](https://github.com/boxcee/forge-flux-deployments/commit/3b81be97c664c4a5778ed059f01ba70d5a976e40))
* **05-02:** add React.StrictMode wrapper and explicit react dependency ([aa5dbaa](https://github.com/boxcee/forge-flux-deployments/commit/aa5dbaa278c88e5a48069203043a90e86677c5cc))
* **05-02:** fix webtrigger key, clean debug logs, add configured placeholders ([b4a5ec1](https://github.com/boxcee/forge-flux-deployments/commit/b4a5ec1abfe3a0262dc0fd0f240b2e87b3550ff3))
* **10-01:** change ArgoCD source value from 'argo' to 'argocd' ([dcd3fda](https://github.com/boxcee/forge-flux-deployments/commit/dcd3fdaf63d0fe9aff16e3a5f11b8c06ffb311d7))
* **docs:** add local sass stub for just-the-docs color_schemes/default ([232dd85](https://github.com/boxcee/forge-flux-deployments/commit/232dd85c35e0fe633d9b901867e07519e32cbd4e))
* guard against missing HMAC secret, remove dead import, hide error details ([fad6114](https://github.com/boxcee/forge-flux-deployments/commit/fad61142c39a80181bf4d934f6f4ba2c84e93bcf))
* **quick-01:** fix @forge/resolver CJS/ESM interop causing constructor error ([cef9b03](https://github.com/boxcee/forge-flux-deployments/commit/cef9b03a42f20027ddcb167e2a6711d280de6e8a))

## [1.2.0](https://github.com/boxcee/forge-flux-deployments/compare/v1.1.0...v1.2.0) (2026-03-16)

### Features

* Webhook event logging to Forge SQL with 30-day retention
* Admin page Event Log tab with stats, filtering, and keyset pagination
* Daily scheduled cleanup of old events

## [1.1.0](https://github.com/boxcee/forge-flux-deployments/compare/v1.0.0...v1.1.0) (2026-03-12)

### Features

* Admin configuration page for webhook secrets
* KVS-based secret storage with admin UI management
* ArgoCD webhook support with bearer token auth

## [1.0.0](https://github.com/boxcee/forge-flux-deployments/releases/tag/v1.0.0) (2026-03-11)

### Features

* FluxCD webhook receiver with HMAC verification
* Jira Deployments API integration
* HelmRelease annotation-based metadata extraction
* Marketplace listing and documentation site
