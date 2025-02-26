# VEDA Data Ingest

This application is to allow users to create PRs in [veda-data](https://github.com/NASA-IMPACT/veda-data) to ingest data.

## Feature Tour

The latest Playwright test report is published after each merge to `main`. This provides screenshots and descriptions of features in the veda-ingest-ui.
https://nasa-impact.github.io/veda-ingest-ui/

It leverages the [Next.js](https://nextjs.org/) and the [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form) to create a React form component based on the JSON Schema for the data ingestion.

The styling of the form uses the [ant design](https://ant.design/) React Framework for components.

Accessing the Github API is done through the [@octokit/rest](https://github.com/octokit/rest.js) GitHub REST API client for JavaScript.

Deployment is handled by AWS Amplify

# Architecture

The application is designed to allow users to create and edit PRs in the veda-data repository.New PRs are created with a prefix of `'Ingest Request for [collectionName]'`. The branch name and file name of the json for these new PRs is set by the Collection Name field in the form after any non-alphanumeric characters are removed from the collection name:

```
const fileName = 'ingestion-data/staging/dataset-config/${collectionName}.json`;
const branchName = `feat/${collectionName}`;
```

All API calls require users to be authenticated via AWS Cognito. The API then obtains a github token and makes the desired calls with the github token.

Users are allowed to edit PRs starting with the prefix `'Ingest Request for '`. It is assumed that all PRs will have the appropriate json file in the standard filepath. The existing values in the json will be loaded into a form. A user can update those values and a new commit will be added to the PR with the new values.

# Requirements

To set up the development environment for this website, you'll need to install the following on your system:

- [Node](http://nodejs.org/) (see version in [.nvmrc](../.nvmrc)) (To manage multiple node versions we recommend [nvm](https://github.com/creationix/nvm))
- [Yarn](https://yarnpkg.com/) Package manager

If you use [`nvm`](https://github.com/creationix/nvm), activate the desired Node version:

## Installation

Install Node + package manager this repo depends on.

```
nvm install
npm -g install yarn
```

Then install project dependencies by running the yarn install.

```
yarn install
```

## Usage

### Config files

Configuration is done using `.env.` files.

Copy the `.env.example` to `.env` to add your configuration variables.
These variables should also be set in AWS Amplify for the deployment.

```sh
cp .env.example .env
```

### Github Access

A Github access to the veda-data repo is handled by installing the veda-ingest-api app in the veda-data repo's settings and saving the following values as environment variables:

```
INSTALLATION_ID
APP_ID
GITHUB_PRIVATE_KEY
```

## Running the app

To preview the app use:

```
yarn dev
```

This will start the app and make it available at <http://localhost:3000/>.

To bypass the cognito login, set the `NEXT_PUBLIC_DISABLE_AUTH` environment variable to true. This variable is als leveraged for Playwright testing.

## Configuring the Validation Form

The fields in the Validation Form are configured by a combination of the json schema in the [jsonschema.json file](FormSchemas/jsonschema.json) and the UI Schema in the [uischema.json file](FormSchemas/uischema.json). To modify fields in the form, a developer must update the json schema to include the proper JSON schema data fields and then modify the ui Schema to have any new or renamed fields in the desired location.

The Form uses a 24 column grid format and the layout of each row is dictated by the "ui:grid" array in that json. Each row is defined as an object with each field allowed up to 24 columns wide. For example:

```json
  "ui:grid": [
    {
      "collection": 4,
      "title": 4,
      "license": 4,
      "description": 12
    },
    ...
  ]
```

the new first row has 4 fields with a combined width of 24. Nested objects in the field can be defined with their own grid. For example,

```json
  "spatial_extent": {
    "ui:grid": [
      {
        "xmin": 12,
        "ymin": 12
      },
      {
        "xmax": 12,
        "ymax": 12
      }
    ]
  },
```

## Cognito Configuration

To set up a Cognito App Client for login, visit the AWS Cognito dashboard:

1. Select your desired User Pool
2. Copy the `User pool ID` from the top of the Overview page for that User Pool and save it as the `NEXT_PUBLIC_USER_POOL_ID` env variable
3. From the left sidebar, select "App clients".
4. Create a new app client with the `Single-page application (SPA)` Application type.
5. For allowed callback URLs, enter `http://localhost`
6. copy the `Client ID` and save it as `NEXT_PUBLIC_USER_POOL_CLIENT_ID` env variable.

## Github Destination Repo Configuration

To allow the veda-ingest-ui to open PRs in a repo, a Github app must be installed on the destination repo and several environment variables are needed from that Github app installation. Follow the [Installing your own GitHub App](https://docs.github.com/en/apps/using-github-apps/installing-your-own-github-app) guide from github to get started:

1. Uncheck the "Active" checkbox under webhook. `No webhook is required.`
2. Ensure the app has `Read and Write` permissions to `Contents` and `Pull Requests`.
3. Create and save a Private Key to place in your env variables.
4. Copy the `App ID` and `Client ID` from the new github app's overview.
5. Copy the Installation ID from the repo's list of Installed GitHub Apps. The Installation ID is found in the URL for that application. For example, `https://github.com/settings/installations/[Installation ID]`.
