# Amplify New Instance Runbook

This runbook documents how to deploy a new ingest-ui instance with AWS Amplify and wire it to a destination data repository.

## 1. Understand the Existing Model

- Existing ingest-ui deployments are connected to Amplify and update from merges to `main`.
- Amplify builds this app using [amplify.yml](../../amplify.yml), including writing required runtime variables to `.env.production` during build.

## 2. Choose Destination Repository Strategy

You have two options for GitHub App auth, depending on destination repository ownership:

1. Destination repo is in `NASA-IMPACT`:

- You can reuse the existing app permissions model (for example, `VEDA-Github-Actor`) by granting that app access to the new destination repository.
- Reuse the corresponding `GITHUB_PRIVATE_KEY`, `APP_ID`, and a repository-specific `INSTALLATION_ID`.

2. Destination repo is in another organization:

- Create a separate GitHub App in that org with equivalent permissions.
- Use that app's `APP_ID`, `INSTALLATION_ID`, and `GITHUB_PRIVATE_KEY` values.

For exact GitHub App fields and permission requirements, see [GitHub App Setup for Destination Repos](./github-app-setup.md).

## 3. Add an Environment Profile in App Config

Add a profile in [config/env.ts](../../config/env.ts) and include:

- `OWNER`
- `REPO`
- `TARGET_BRANCH`
- `AWS_REGION`
- `NEXT_PUBLIC_AWS_S3_BUCKET_NAME`
- `ADDITIONAL_LOGO`
- `VEDA_BACKEND_URL`
- `VEDA_PROD_BACKEND_URL`
- `DATASET_FORM_SCHEMA_PROFILE`
- Optional `VEDA_TENANT_FILTER_FIELD`

Then set `NEXT_PUBLIC_APP_ENV` in Amplify to match your new profile key.

## 4. Configure Amplify Environment Variables

In Amplify Console, set non-secret environment variables:

- `APP_RUNTIME_SECRET_ID`
- `APP_ID`
- `INSTALLATION_ID`
- `ASSUME_ROLE_ARN`
- `KEYCLOAK_CLIENT_ID`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_KEYCLOAK_ISSUER`
- `NEXT_PUBLIC_APP_ENV`

## 5. Configure Secrets Manager Runtime Secret

Create a Secrets Manager secret (same account/region as Amplify compute) with this JSON shape:

```json
{
  "GITHUB_PRIVATE_KEY": "-----BEGIN RSA PRIVATE KEY-----\\n...\\n-----END RSA PRIVATE KEY-----\\n",
  "KEYCLOAK_CLIENT_SECRET": "your-keycloak-client-secret",
  "NEXTAUTH_SECRET": "your-nextauth-secret",
  "INGEST_UI_EXTERNAL_ID": "your-external-id"
}
```

Notes:

- Keep keys at the top level.
- Use escaped newlines (`\\n`) for `GITHUB_PRIVATE_KEY`.
- Set `APP_RUNTIME_SECRET_ID` to this secret ARN or name.

## 6. Ensure Amplify Runtime IAM Permissions

The Amplify SSR runtime role must allow:

- `sts:AssumeRole` for your thumbnail upload role
- `secretsmanager:GetSecretValue`
- `secretsmanager:DescribeSecret`

Scope resources to the role and secret ARNs used by your environment.

## 7. Connect Branch Deployment Behavior

Ensure your Amplify app is connected to the intended branch (typically `main`) for automatic deployment on merge.
