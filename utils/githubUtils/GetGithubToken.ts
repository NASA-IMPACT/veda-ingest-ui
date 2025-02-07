import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

interface AuthResult {
  token: string;
}

export default async function GetGithubToken(): Promise<string> {
  const appId = parseInt(process.env.APP_ID || '');
  const installationId = parseInt(process.env.INSTALLATION_ID || '');
  const rawKey = process.env.GITHUB_PRIVATE_KEY;

  if (isNaN(appId) || isNaN(installationId) || !rawKey) {
    throw new Error(
      'Missing or invalid environment variables for GitHub authentication'
    );
  }

  const privateKey = rawKey.replace(/\\n/g, '\n');
  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });

  try {
    const authResult = (await appOctokit.auth({
      type: 'installation',
      installationId,
    })) as AuthResult;

    return authResult.token;
  } catch (error) {
    console.error('Error fetching GitHub token:', error);
    throw new Error('Failed to fetch GitHub token');
  }
}
