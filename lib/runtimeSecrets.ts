import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

export type RuntimeSecretKey =
  | 'GITHUB_PRIVATE_KEY'
  | 'KEYCLOAK_CLIENT_SECRET'
  | 'NEXTAUTH_SECRET'
  | 'INGEST_UI_EXTERNAL_ID';

const runtimeSecretKeys: RuntimeSecretKey[] = [
  'GITHUB_PRIVATE_KEY',
  'KEYCLOAK_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
  'INGEST_UI_EXTERNAL_ID',
];

type RuntimeSecrets = Partial<Record<RuntimeSecretKey, string>>;

const RUNTIME_SECRETS_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedSecrets: RuntimeSecrets | null = null;
let cacheExpiresAt = 0;
let inFlightLoad: Promise<RuntimeSecrets> | null = null;

const getSecretId = (): string | undefined => {
  const secretId = process.env.APP_RUNTIME_SECRET_ID?.trim();
  return secretId ? secretId : undefined;
};

const getSecretValueString = async (
  client: SecretsManagerClient,
  secretId: string
): Promise<string | undefined> => {
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretId })
  );

  if (response.SecretString) {
    return response.SecretString;
  }

  if (response.SecretBinary) {
    return Buffer.from(response.SecretBinary).toString('utf-8');
  }

  return undefined;
};

const parseSecretJson = (rawValue: string): RuntimeSecrets => {
  const parsed = JSON.parse(rawValue) as unknown;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Secret value must be a JSON object');
  }

  const objectValue = parsed as Record<string, unknown>;
  const secrets: RuntimeSecrets = {};

  for (const key of runtimeSecretKeys) {
    const candidate = objectValue[key];
    if (typeof candidate === 'string' && candidate.length > 0) {
      secrets[key] = candidate;
    }
  }

  return secrets;
};

const loadSecretsFromSecretsManager = async (): Promise<RuntimeSecrets> => {
  const secretId = getSecretId();
  if (!secretId) {
    return {};
  }

  try {
    const client = new SecretsManagerClient({});
    const rawValue = await getSecretValueString(client, secretId);

    if (!rawValue) {
      console.warn(
        `[secrets] Secret '${secretId}' has no SecretString/SecretBinary value; using env fallback`
      );
      return {};
    }

    return parseSecretJson(rawValue);
  } catch (error) {
    console.warn(
      `[secrets] Failed to load secret '${secretId}' from Secrets Manager; using env fallback`
    );
    console.warn(
      `[secrets] Error: ${error instanceof Error ? error.message : String(error)}`
    );
    return {};
  }
};

const mergeWithEnvFallback = (secretValues: RuntimeSecrets): RuntimeSecrets => {
  const resolved: RuntimeSecrets = { ...secretValues };

  for (const key of runtimeSecretKeys) {
    if (!resolved[key] && process.env[key]) {
      resolved[key] = process.env[key];
    }
  }

  return resolved;
};

const loadSecrets = async (): Promise<RuntimeSecrets> => {
  const now = Date.now();
  if (cachedSecrets && now < cacheExpiresAt) {
    return cachedSecrets;
  }

  if (!inFlightLoad) {
    inFlightLoad = (async () => {
      const fromSecretsManager = await loadSecretsFromSecretsManager();
      const resolved = mergeWithEnvFallback(fromSecretsManager);
      cachedSecrets = resolved;
      cacheExpiresAt = Date.now() + RUNTIME_SECRETS_CACHE_TTL_MS;
      return resolved;
    })().finally(() => {
      inFlightLoad = null;
    });
  }

  return inFlightLoad;
};

export const getRuntimeSecret = async (
  key: RuntimeSecretKey
): Promise<string | undefined> => {
  const secrets = await loadSecrets();
  return secrets[key];
};

export const getRequiredRuntimeSecret = async (
  key: RuntimeSecretKey
): Promise<string> => {
  const value = await getRuntimeSecret(key);
  if (!value) {
    throw new Error(
      `Missing required secret '${key}'. Configure APP_RUNTIME_SECRET_ID with JSON containing '${key}', or set ${key} as an environment variable.`
    );
  }
  return value;
};
