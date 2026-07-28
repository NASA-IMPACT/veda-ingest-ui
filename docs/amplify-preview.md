# Amplify PR Previews

This document explains how the `amplify-pr-preview.yml` GitHub Actions workflow builds and tears down AWS Amplify preview deployments for pull requests, and how it authenticates to AWS.

## Purpose

On every PR against `main`, an Amplify branch deployment is spun up. When the PR closes, the workflow deletes the Amplify branch to avoid leaking stale preview environments.

Previews are only created for the **veda-ingest-ui** app itself and not for the other instances.

## Required Configuration

The workflow relies on these values, sourced from the `veda` GitHub environment as repository variables.

- `AMPLIFY_APP_ID` — the Amplify app ID that previews are created under.
- `AMPLIFY_PREVIEW_ROLE` — the ARN of the IAM role assumed via OIDC to call the Amplify API.

## IAM Role and OIDC Trust

The workflow authenticates to AWS using `aws-actions/configure-aws-credentials`, assuming the role at `vars.AMPLIFY_PREVIEW_ROLE` via GitHub's OIDC identity provider.

`GitHubActionsAmplifyPreviewRole` IAM Role was created in the **UAH** AWS account from an existing `token.actions.githubusercontent.com` OIDC provider. Its trust policy allows GitHub Actions runs from this repository to assume it, and its permissions policy is scoped to the Amplify actions the workflow needs (`get-branch`, `create-branch`, `start-job`, `get-job`, `delete-branch`) against the `veda-ingest-ui` Amplify app.
