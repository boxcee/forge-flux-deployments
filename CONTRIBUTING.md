# Contributing to GitOps Deployments for Jira

Thanks for your interest in contributing. This guide covers development setup, testing, and the contribution workflow.

## Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [Atlassian Forge CLI](https://developer.atlassian.com/platform/forge/getting-started/) (`npm install -g @forge/cli`)
- A Jira Cloud site with Jira Software

## Development Setup

```bash
git clone https://github.com/boxcee/forge-flux-deployments.git
cd forge-flux-deployments
npm install
```

## Testing

Tests use Jest with native ESM. No external services required.

```bash
npm test                                    # run all tests
npm run lint                                # run ESLint
```

Run a single test file:

```bash
node --experimental-vm-modules node_modules/.bin/jest --testPathPattern='<pattern>'
```

## Running Locally

Use Forge tunnel for live debugging against your Jira site:

```bash
forge tunnel
```

## Deploying

```bash
forge deploy --environment development
```

See the [setup guide](https://boxcee.github.io/forge-flux-deployments/setup) for full deployment and installation steps.

## Contribution Workflow

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes with tests
4. Run `npm test` and `npm run lint` to verify
5. Open a pull request against `main`

Please keep PRs focused on a single change. Include tests for new functionality.

## License

By contributing, you agree that your contributions will be licensed under the [Elastic License 2.0](LICENSE).

## Questions

Open an issue on [GitHub](https://github.com/boxcee/forge-flux-deployments/issues) for questions or discussion.
