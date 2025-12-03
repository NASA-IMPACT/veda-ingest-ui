// Centralized environment configuration with typed profiles
// Switch via `NEXT_PUBLIC_APP_ENV` = 'local' | 'veda' | 'disasters'

export type AppEnv = 'local' | 'veda' | 'disasters';

interface EnvConfig {
  OWNER: string;
  REPO: string;
  TARGET_BRANCH: string;
  AWS_REGION: string;
  NEXT_PUBLIC_AWS_S3_BUCKET_NAME: string;
}

const profiles: Record<AppEnv, EnvConfig> = {
  local: {
    OWNER: 'nasa-impact',
    REPO: 'veda-ingest-ui-testing',
    TARGET_BRANCH: 'main',
    AWS_REGION: 'us-west-2',
    NEXT_PUBLIC_AWS_S3_BUCKET_NAME: 'veda-thumbnails',
  },
  veda: {
    OWNER: 'nasa-impact',
    REPO: 'veda-ingest-ui',
    TARGET_BRANCH: 'main',
    AWS_REGION: 'us-west-2',
    NEXT_PUBLIC_AWS_S3_BUCKET_NAME: 'veda-thumbnails',
  },
  disasters: {
    OWNER: 'nasa-impact',
    REPO: 'disaster-data',
    TARGET_BRANCH: 'main',
    AWS_REGION: 'us-west-2',
    NEXT_PUBLIC_AWS_S3_BUCKET_NAME: 'veda-thumbnails',
  },
};

const getAppEnv = (): AppEnv => {
  const raw = process.env.NEXT_PUBLIC_APP_ENV?.toLowerCase();
  if (raw === 'veda' || raw === 'disasters' || raw === 'local') return raw;
  return 'local';
};

export const cfg: EnvConfig = profiles[getAppEnv()];
