import { Octokit } from '@octokit/rest';
import { RequestError } from '@octokit/request-error';
import { createAppAuth } from '@octokit/auth-app';
import { head } from 'lodash';

const base = 'master';
const prefix = 'Ingest Request for ';
const targetPath = 'ingestion-data/staging/dataset-config';
const owner = process.env.OWNER || '';
const repo = process.env.REPO || '';
const appId = parseInt(process.env.APP_ID || '');
const installationId = parseInt(process.env.INSTALLATION_ID || '');
const rawkey = process.env.GITHUB_PRIVATE_KEY || '';

const privateKey = rawkey.replace(/\\n/g, '\n');

const UpdatePR = async (ref: string, fileSha: string, filePath: string, formData: any) => {
  // prettify stringify to preserve json formatting
  const stringContent = JSON.stringify(formData, null, 2);
  const content = btoa(stringContent);

  try {
    const appOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey,
        installationId,
      },
    });

    //  @ts-expect-error token should work
    const { token } = await appOctokit.auth({
      type: 'installation',
      installationId,
    });

    const octokit = new Octokit({
      auth: token,
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      branch: ref,
      sha: fileSha,
      path: filePath,
      message: 'update via UI',
      content,
    })

    return 
  } catch (error) {
    console.error('Unexpected Error:', error); 
    throw error
  }
};

export default UpdatePR;
