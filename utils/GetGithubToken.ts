import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

const appId = parseInt(process.env.APP_ID || '');
const installationId = parseInt(process.env.INSTALLATION_ID || '');
const rawkey = process.env.GITHUB_PRIVATE_KEY || '';

const privateKey = rawkey.replace(/\\n/g, '\n');

export default async function GetGithubToken(): Promise<string> {
  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });

  //  @ts-expect-error dunno
  const { token } = await appOctokit.auth({
    type: 'installation',
    installationId,
  });

  return token as string;
}
