// Centralized environment configuration with typed profiles
// Switch via `NEXT_PUBLIC_APP_ENV` = 'local' | 'veda' | 'disasters'

export type AppEnv = 'local' | 'eic' | 'disasters' | 'veda';

interface EnvConfig {
  OWNER: string;
  REPO: string;
  TARGET_BRANCH: string;
  AWS_REGION: string;
  NEXT_PUBLIC_AWS_S3_BUCKET_NAME: string;
  ADDITIONAL_LOGO: string;
  VEDA_BACKEND_URL: string;
}

const profiles: Record<AppEnv, EnvConfig> = {
  local: {
    OWNER: 'nasa-impact',
    REPO: 'veda-ingest-ui-testing',
    TARGET_BRANCH: 'main',
    AWS_REGION: 'us-west-2',
    NEXT_PUBLIC_AWS_S3_BUCKET_NAME: 'veda-thumbnails',
    ADDITIONAL_LOGO: '',
    VEDA_BACKEND_URL: 'https://staging.openveda.cloud/api',
  },
  disasters: {
    OWNER: 'Disasters-Learning-Portal',
    REPO: 'disaster-data',
    TARGET_BRANCH: 'main',
    AWS_REGION: 'us-west-2',
    NEXT_PUBLIC_AWS_S3_BUCKET_NAME: 'veda-thumbnails',
    ADDITIONAL_LOGO: 'disasters',
    VEDA_BACKEND_URL: 'https://staging.openveda.cloud/api',
  },
  veda: {
    OWNER: 'nasa-impact',
    REPO: 'veda-data',
    TARGET_BRANCH: 'main',
    AWS_REGION: 'us-west-2',
    NEXT_PUBLIC_AWS_S3_BUCKET_NAME: 'veda-thumbnails',
    ADDITIONAL_LOGO: '',
    VEDA_BACKEND_URL: 'https://staging.openveda.cloud/api',
  },
  eic: {
    OWNER: 'nasa-impact',
    REPO: 'eic-data',
    TARGET_BRANCH: 'main',
    AWS_REGION: 'us-west-2',
    NEXT_PUBLIC_AWS_S3_BUCKET_NAME: 'veda-thumbnails',
    ADDITIONAL_LOGO: 'eic',
    VEDA_BACKEND_URL: 'https://staging.openveda.cloud/api',
  },
};

const getAppEnv = (): AppEnv => {
  const raw = process.env.NEXT_PUBLIC_APP_ENV?.toLowerCase();
  if (raw === 'veda' || raw === 'disasters' || raw === 'local' || raw === 'eic')
    return raw;
  return 'local';
};

export const cfg: EnvConfig = profiles[getAppEnv()];
export const VEDA_BACKEND_URL = cfg.VEDA_BACKEND_URL;
