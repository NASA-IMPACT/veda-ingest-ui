# Deployment Guides

Use these guides when standing up a new ingest-ui instance.

- [Amplify New Instance Runbook](./amplify-new-instance-runbook.md)
- [GitHub App Setup for Destination Repos](./github-app-setup.md)

## Current Delivery Model

For existing instances, deployments are connected to AWS Amplify and update from merges to `main` on the connected repository branch.

## Which Guide Should I Start With?

1. Start with the Amplify runbook for end-to-end setup.
2. Use the GitHub App guide for selecting or creating the app and filling `APP_ID`, `INSTALLATION_ID`, and `GITHUB_PRIVATE_KEY`.
