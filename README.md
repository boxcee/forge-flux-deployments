# GitOps Deployments for Jira

[![License: Elastic-2.0](https://img.shields.io/badge/License-Elastic--2.0-blue)](LICENSE)
[![Node.js: 22+](https://img.shields.io/badge/Node.js-22%2B-green)](https://nodejs.org/)
[![Platform: Atlassian Forge](https://img.shields.io/badge/Platform-Atlassian%20Forge-0052CC)](https://developer.atlassian.com/platform/forge/)

Atlassian Forge app that receives FluxCD and ArgoCD webhook events and creates Jira deployment records.

## Features

- Native Jira Deployments panel integration
- FluxCD support (HMAC webhook authentication)
- ArgoCD support (bearer token authentication)
- Tracks deployment states: successful, failed, in_progress, rolled_back
- Runs on Atlassian Forge (no infrastructure to manage)

## Quick Start

```bash
forge deploy --environment development       # deploy the app
forge install --site <site>.atlassian.net     # install on your Jira site
# annotate your HelmRelease or ArgoCD Application with Jira issue keys
```

See the [full setup guide](https://boxcee.github.io/forge-flux-deployments/setup) for detailed instructions.

## Links

- [Documentation](https://boxcee.github.io/forge-flux-deployments/)
- [Setup Guide](https://boxcee.github.io/forge-flux-deployments/setup)
- [Atlassian Marketplace](https://marketplace.atlassian.com/)
- [Issues](https://github.com/boxcee/forge-flux-deployments/issues)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

## License

This project is licensed under the [Elastic License 2.0](LICENSE).
