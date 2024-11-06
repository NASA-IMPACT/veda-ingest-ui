# VEDA Data Ingest

This application is to allow users to create PRs in [veda-data](https://github.com/NASA-IMPACT/veda-data) to ingest data.

It leverages the [Vite](https://vite.dev/) javascript build tool and the [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form) to create a React form component based on the JSON Schema for the data ingestion.

The styling of the form uses the [ant design](https://ant.design/) React Framework for components.

Accessing the Github API is done through the [@octokit/rest](https://github.com/octokit/rest.js) GitHub REST API client for JavaScript.


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

Configuration is done using [`.env.` files through Vite](https://vite.dev/guide/env-and-mode)

Copy the `.env` to `.env.local` to add your configuration variables.

```sh
cp .env .env.local
```

### Github Token

A Github fine grained access Token is needed to have access to the repo.  [Create that token](https://github.com/settings/tokens) on your github profile with the permissions:
- Read access to metadata
- Read and Write access to code and pull requests

Put the key in `.env.local` file.

## Running the app

To preview the app use:

```
yarn dev
```

This will start the app and make it available at <http://localhost:5173/>.