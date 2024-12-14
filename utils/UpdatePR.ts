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

const UpdatePR = async (ref: string, sha: string, formData: any) => {
  console.log('updating pr with: ', formData)
  // prettify stringify to preserve json formatting
  const stringContent = JSON.stringify(formData, null, 2);
  const content = btoa(stringContent);

  console.log('content will be:', content);

  try {
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

    const octokit = new Octokit({
      auth: token,
    });

    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      branch: ref,
      sha,
      path: `${targetPath}/fridaythe13.json`,
      message: 'update via UI',
      content,
    })

    console.log(response)
    return;
  } catch (error) {
    console.log(error);
    if (error instanceof RequestError) {
      // branch with branchName already exists
      if (error['status'] === 422 && error.response) {
        console.error('we have an error');
        // @ts-expect-error octokit typing issue
        const errorMessage = error.response.data.message as string;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
    }
  }
};

export default UpdatePR;
