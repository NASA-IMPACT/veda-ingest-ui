# VEDA Data Ingest

This application is to allow users to create PRs in a data repo such as [veda-data](https://github.com/NASA-IMPACT/veda-data) to ingest data into the staging environment.

## Quick Start

```bash
# Install dependencies
yarn install

# Set up local environment (see Environment Setup below)
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Start development server
yarn dev
```

## Deployment Docs

Deployment guidance is split into focused docs:

- [Deployment Guides Index](docs/deployment/README.md)
- [Amplify New Instance Runbook](docs/deployment/amplify-new-instance-runbook.md)
- [GitHub App Setup for Destination Repos](docs/deployment/github-app-setup.md)

## Architecture & Security Docs

- [App Environment Profiles](docs/app-environment-profiles.md)
- [Middleware Architecture](docs/middleware-architecture.md)
- [Security Architecture](docs/security.md)
- [GitHub Integration](docs/github-integration.md)

## Feature Tour

The latest Playwright test report is published after each merge to `main`. This provides screenshots and descriptions of features in the veda-ingest-ui.
https://nasa-impact.github.io/veda-ingest-ui/

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 15+ with App Router
- **Form Generation**: [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form) for dynamic forms
- **UI Components**: [Ant Design](https://ant.design/) React framework
- **GitHub API**: [@octokit/rest](https://github.com/octokit/rest.js) for GitHub operations
- **Authentication**: Keycloak via NextAuth.js
- **Testing**: Vitest + Playwright for comprehensive testing
- **Deployment**: AWS Amplify with serverless architecture

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes for GitHub operations and STAC API
│   ├── collections/       # Collection management pages
│   ├── datasets/          # Dataset management pages
│   ├── edit-existing-collection/ # STAC collection editing interface
│   └── upload/            # File upload functionality
├── components/            # Reusable React components
│   ├── ingestion/        # Form components for data ingestion and editing
│   ├── layout/           # Layout components (header, sidebar, etc.)
│   ├── rjsf-components/  # Custom RJSF form components
│   ├── thumbnails/       # Thumbnail upload components
│   └── ui/               # General UI components
├── FormSchemas/          # JSON schemas for form generation
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries and configurations
├── types/                # TypeScript type definitions
├── utils/                # Helper functions and GitHub utilities
└── __tests__/            # Test suites (unit, integration, e2e)
```

## Form System & RJSF Customization

This application uses [react-jsonschema-form (RJSF)](https://rjsf-team.github.io/react-jsonschema-form/) to generate forms from JSON Schema definitions. This approach provides several key advantages:

- **Schema-driven**: Form structure, validation rules, and defaults are defined once in JSON Schema and reused across create/edit flows, reducing code duplication
- **Multi-profile support**: Different data ingestion profiles (e.g., `default` vs. `disasters`) can have distinct forms with different field requirements, without duplicating form logic
- **Dual interface**: Users can edit via visual form **or** direct JSON editor, with bidirectional sync and validation
- **Composability**: Forms initialize from defaults, validate against schema, and serialize back to schema-compliant JSON

**Why customization is necessary?**

- **Layout control**: RJSF out-of-the-box doesn't support complex responsive grid layouts; we customize ObjectFieldTemplate with Ant Design's grid system for professional multi-column layouts
- **Domain-specific widgets**: Standard input widgets don't handle some VEDA-specific fields and complex objects (COG file validation, renders dashboard, asset management, regex fields). Custom widgets encapsulate this domain logic
- **Theme integration**: Ant Design theming requires custom overrides to work reliably with RJSF v6

See [RJSF Customization Guide](docs/rjsf-customization.md) for detailed patterns and component architecture.

# Architecture

The application supports two primary workflows:

## 1. Data Ingestion

The application allows users to create and edit PRs in the data repository for data ingestion. New PRs are created with a prefix of `'[collection/dataset] Ingest Request for [collectionName]'`. The branch name and file name of the json for these new PRs is set by the Collection Name field in the form after any non-alphanumeric characters are removed from the collection name:

```
const fileName = 'ingestion-data/staging/dataset-config/${collectionName}.json';
const branchName = `feat/${collectionName}`;
```

Users are allowed to edit open PRs that are modifying json files in the standard filepath for each ingestion type. The existing values in the json will be loaded into a form. A user can update those values and a new commit will be added to the PR with the new values.

## 2. Collection Editing

The application also provides direct editing of existing STAC collections through the STAC API. User must have `stac:collection:update` scope from keycloak for editing permissions.

- **Collection Discovery**: Browse existing collections from `/api/stac/collections`
- **Real-time Editing**: Modify collection metadata directly without GitHub PRs
- **Data Sanitization**: Automatic STAC schema compliance with null-to-array/object conversion and datetime format fixes. This helps clean legacy formatting errors in veda-data.

## Authentication & Authorization

All API calls require users to be authenticated via Keycloak.

- **GitHub Operations**: Uses GitHub token for repository operations
- **STAC Operations**: Uses access token for STAC API calls with tenant-based permissions
- **Tenant Filtering**: Support for multi-tenant environments with proper access controls

### Scope Model

The app currently uses four application scopes:

- `dataset:limited-access`
- `dataset:create`
- `dataset:update`
- `stac:collection:update`

Behavior is derived from scopes:

- `dataset:limited-access` takes precedence and restricts create/edit features.
- `dataset:create` enables create flows (including thumbnail upload) but not ingest edit flows.
- `dataset:update` enables ingest edit flows.
- `stac:collection:update` enables editing existing STAC collections.

### Authorization Implementation

Authorization logic is centralized and shared across proxy, UI, and API routes:

- `lib/authorization/policy.ts`: scope constants and capability derivation from session scopes.
- `lib/authorization/withPermission.ts`: shared route-handler wrapper for auth + permission checks.

### Access Matrix

Current intended access behavior:

| Scope state                                 | Collections / Datasets landing pages | Create Ingest (`/create-*`, `/upload`, `/api/create-ingest`, `/api/upload-url`) | Edit Ingest (`/edit-*`, `/api/list-ingests`, `/api/retrieve-ingest`, `/api/create-ingest` PUT) | Edit Existing Collection (`/edit-existing-collection`, `/api/existing-collection/*`) |
| ------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Unauthenticated                             | Redirect `/login`                    | Deny                                                                            | Deny                                                                                           | Deny                                                                                 |
| Authenticated with no app scopes            | Redirect `/unauthorized`             | Deny                                                                            | Deny                                                                                           | Deny                                                                                 |
| `dataset:limited-access`                    | Allow                                | Deny                                                                            | Deny                                                                                           | Deny                                                                                 |
| `dataset:create`                            | Allow                                | Allow                                                                           | Deny                                                                                           | Deny                                                                                 |
| `dataset:update`                            | Allow                                | Allow                                                                           | Allow                                                                                          | Deny                                                                                 |
| `stac:collection:update`                    | Allow                                | Allow                                                                           | Deny                                                                                           | Allow                                                                                |
| `dataset:update` + `stac:collection:update` | Allow                                | Allow                                                                           | Allow                                                                                          | Allow                                                                                |

### Where Authorization Is Enforced

Authorization is enforced in multiple layers:

- **Proxy route guard**: `proxy.ts` checks route access and redirects/returns 401/403 for matched routes.
- **API route checks**: API handlers validate session/scopes using the shared `withPermission` wrapper and capability policy.
- **Page access model**: pages rely on `proxy.ts` for route-level auth/authorization (no page-specific capability checks).
- **Client UI gating**: navigation/cards are disabled using shared capabilities for better UX.

### API Authorization Summary

Current API authorization requirements:

- `POST /api/create-ingest`: authenticated + create capability
- `PUT /api/create-ingest`: authenticated + edit-ingest capability
- `GET /api/list-ingests`: authenticated + edit-ingest capability
- `GET /api/retrieve-ingest`: authenticated + edit-ingest capability
- `GET /api/existing-collection`: authenticated + stac edit capability
- `GET/PUT /api/existing-collection/[collectionId]`: authenticated + stac edit capability
- `POST /api/upload-url`: authenticated + create capability

### Mocking Auth Locally

For local/test development:

- Set `NEXT_PUBLIC_DISABLE_AUTH=true` to bypass Keycloak login.
- Set `NEXT_PUBLIC_MOCK_SCOPES` to simulate permissions.
- Set `NEXT_PUBLIC_MOCK_TENANTS` to simulate tenant access.

Examples:

```bash
NEXT_PUBLIC_DISABLE_AUTH=true
NEXT_PUBLIC_MOCK_SCOPES="dataset:update stac:collection:update dataset:create"
# NEXT_PUBLIC_MOCK_TENANTS=tenant1,tenant2
```

## Creation Component Architecture

```mermaid
graph TD
    subgraph "Creation Flow"
        A[CreationFormManager] -->|Sends POST Request| API_POST[API];
        A -->|Receives 'ingestionType' prop| B{Render based on type};

        subgraph "UI & Validation"
            C[DatasetIngestionForm]
            C --> C_E{Render UI Tabs};
            C_E --> C_F[RJSF Form];
            C_E --> C_G[JSON Editor];
            C_F --> C_H["FormSchemas/datasets"];
            C_G --> C_H;
        end

        subgraph "UI & Validation"
            D[CollectionIngestionForm]
            D --> D_E{Render UI Tabs};
            D_E --> D_F[RJSF Form];
            D_E --> D_G[JSON Editor];
            D_F --> D_I["FormSchemas/collections"];
            D_G --> D_I;
        end

        B -- "dataset" --> C;
        B -- "collection" --> D;
    end

    style A fill:#0B3D91,stroke:#fff,stroke-width:2px,color:#fff
    style B fill:#BCC6CC,stroke:#333,stroke-width:2px,color:#000
    style C fill:#A4D3EE,stroke:#333,stroke-width:2px,color:#000
    style D fill:#A4D3EE,stroke:#333,stroke-width:2px,color:#000
    style API_POST fill:#FC3D21,stroke:#333,stroke-width:2px
```

## Edit Component Architecture

```mermaid
graph TD
    subgraph "Edit Flow"
        A[EditFormManager] -->|Sends PUT Request| API_PUT[API];
        A -->|Receives 'ingestionType' & 'disableName' props| B{Render based on type};

        subgraph "Dataset Form"
            C_Edit[DatasetIngestionForm]
            C_Edit --Name fields disabled--> C_E_Edit{Render UI Tabs};
            C_E_Edit --> C_F_Edit[RJSF Form];
            C_E_Edit --> C_G_Edit[JSON Editor];
            C_F_Edit --> C_H_Edit["FormSchemas/datasets"];
            C_G_Edit --> C_H_Edit;
        end

        subgraph "Collection Form"
            D_Edit[CollectionIngestionForm]
            D_Edit --Name fields disabled--> D_E_Edit{Render UI Tabs};
            D_E_Edit --> D_F_Edit[RJSF Form];
            D_E_Edit --> D_G_Edit[JSON Editor];
            D_F_Edit --> D_I_Edit["FormSchemas/collections"];
            D_G_Edit --> D_I_Edit;
        end

        B -- "dataset" --> C_Edit;
        B -- "collection" --> D_Edit;
    end

    style A fill:#0B3D91,stroke:#fff,stroke-width:2px,color:#fff
    style B fill:#BCC6CC,stroke:#333,stroke-width:2px,color:#000
    style C_Edit fill:#A4D3EE,stroke:#333,stroke-width:2px,color:#000
    style D_Edit fill:#A4D3EE,stroke:#333,stroke-width:2px,color:#000
    style API_PUT fill:#FC3D21,stroke:#333,stroke-width:2px

```

## Edit Existing Collection Flow Architecture

```mermaid
graph TD
  subgraph "Edit Existing Collection"
    PAGE[edit-existing-collection page]
    PAGE --> CLIENT[EditExistingCollectionClient]

    CLIENT --> LIST[ExistingCollectionsList]
    LIST -->|Select collection| EDIT[EditCollectionView]
    EDIT -->|Cancel or complete| LIST

    LIST -->|GET /api/existing-collection| API_LIST[API list route]
    API_LIST -->|Reads from| STAC_LIST["STAC collections endpoint"]

    EDIT -->|GET /api/existing-collection/:collectionId| API_GET[API collection route]
    EDIT -->|PUT /api/existing-collection/:collectionId| API_PUT[API collection route]

    API_GET --> AUTH{Auth + stac:collection:update scope}
    API_PUT --> AUTH
    AUTH --> TENANT{Tenant access validation}
    TENANT -->|Allowed| STAC_ITEM["STAC collection endpoint"]
    TENANT -->|Denied| FORBIDDEN[403]

    API_PUT -->|On success| STAC_ITEM
  end

  style PAGE fill:#0B3D91,stroke:#fff,stroke-width:2px,color:#fff
  style CLIENT fill:#A4D3EE,stroke:#333,stroke-width:2px,color:#000
  style LIST fill:#A4D3EE,stroke:#333,stroke-width:2px,color:#000
  style EDIT fill:#A4D3EE,stroke:#333,stroke-width:2px,color:#000
  style API_LIST fill:#FC3D21,stroke:#333,stroke-width:2px,color:#fff
  style API_GET fill:#FC3D21,stroke:#333,stroke-width:2px,color:#fff
  style API_PUT fill:#FC3D21,stroke:#333,stroke-width:2px,color:#fff
  style AUTH fill:#BCC6CC,stroke:#333,stroke-width:2px,color:#000
  style TENANT fill:#BCC6CC,stroke:#333,stroke-width:2px,color:#000
  style FORBIDDEN fill:#f7c6c7,stroke:#333,stroke-width:2px,color:#000
```

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

## 🔐 Environment Setup

### Local Development

Configuration uses environment files that are **never committed** to version control for security.

1. **Create your local environment file:**

   ```bash
   cp .env.local.example .env.local
   ```

2. **Configure required variables in `.env.local`:**

   **GitHub App Configuration:**

   ```bash
   APP_ID=your-app-id                    # GitHub App ID
   INSTALLATION_ID=your-installation-id   # GitHub App installation ID
   GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
   ...your private key here...
   -----END RSA PRIVATE KEY-----"
   ```

   **AWS Configuration:**

   ```bash
   ASSUME_ROLE_ARN="arn:aws:iam::account-id:role/role-name"
   INGEST_UI_EXTERNAL_ID="your-external-id"
   ```

   **Authentication:**

   ```bash
   NEXTAUTH_SECRET="your-secret-key"     # Generate with: openssl rand -base64 32
   NEXTAUTH_URL="http://localhost:3000"
   KEYCLOAK_CLIENT_ID="ingest-ui"
   KEYCLOAK_CLIENT_SECRET="your-client-secret"
   NEXT_PUBLIC_KEYCLOAK_ISSUER="https://your-keycloak-server/realms/veda"
   ```

   **Development Options:**

   ```bash
   NEXT_PUBLIC_APP_ENV="local"           # or "veda", "eic", "disasters"
   NEXT_PUBLIC_DISABLE_AUTH=true         # Bypass Keycloak for local dev without keycloak scope configuration
   NEXT_PUBLIC_MOCK_SCOPES="dataset:update,stac:collection:update"
   # NEXT_PUBLIC_MOCK_TENANTS=tenant1,tenant2
   ```

3. **Verify `.env.local` is gitignored:**
   ```bash
   git check-ignore .env.local  # Should output: .env.local
   ```

### AWS Amplify Deployment

For production deployments, use the runbook:

- [Amplify New Instance Runbook](docs/deployment/amplify-new-instance-runbook.md)

It includes:

- Branch deployment behavior for merge-to-main workflows
- Required Amplify environment variables
- Secrets Manager JSON shape and runtime secret wiring
- Runtime IAM permissions and post-deploy validation checklist

### Github Access

GitHub access is handled via a GitHub App installed on the target repository. Use:

- [GitHub App Setup for Destination Repos](docs/deployment/github-app-setup.md)

## Running the app

To preview the app use:

```
yarn dev
```

This will start the app and make it available at <http://localhost:3000/>.

To bypass the keycloak login, set the `NEXT_PUBLIC_DISABLE_AUTH` environment variable to true. This variable is also leveraged for Playwright testing.

## 🛠️ STAC Data Sanitization

To fix incorrect, previously ingested data, the application includes a data sanitization system to ensure STAC schema compliance:

### Sanitization Features

- **Null Handling**: Converts `null` values to appropriate empty arrays or objects
- **Datetime Format**: Fixes timezone and separator issues (e.g., `+00` → `+00:00`, space → `T`)

### Implementation

Sanitization logic is located in `utils/stacSanitization.ts` and includes:

```typescript
// Main sanitization function
import { sanitizeFormData } from '@/utils/stacSanitization';

const cleanedData = sanitizeFormData(formData);
```

### Field Type Rules

- **Arrays**: `stac_extensions`, `keywords`, `providers`, `links`
- **Objects**: `assets`, `item_assets`, `summaries`
- **Datetime Strings**: Temporal extent fields with format fixes

## Configuring the Validation Form

The fields in the Validation Form are configured by a combination of the json schema in the [jsonschema.json file](FormSchemas/**/jsonschema.json) and the UI Schema in the [uischema.json file](FormSchemas/**/uischema.json). To modify fields in the form, a developer must update the json schema to include the proper JSON schema data fields and then modify the ui Schema to have any new or renamed fields in the desired location.

For customization details (templates, widgets, fields, and theme overrides), see [RJSF Customization Guide](docs/rjsf-customization.md).

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

## Github Destination Repo Configuration

Use the dedicated guide for app setup, field mapping, and org-specific decision points:

- [GitHub App Setup for Destination Repos](docs/deployment/github-app-setup.md)
