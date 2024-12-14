import { Octokit } from '@octokit/rest';
import { RequestError } from '@octokit/request-error';
import { createAppAuth } from '@octokit/auth-app';
import { filter, head } from 'lodash';

const base = 'master';
const prefix = 'Ingest Request for ';
const owner = process.env.OWNER || '';
const repo = process.env.REPO || '';
const appId = parseInt(process.env.APP_ID || '');
const installationId = parseInt(process.env.INSTALLATION_ID || '');
const rawkey = process.env.GITHUB_PRIVATE_KEY || '';

const privateKey = rawkey.replace(/\\n/g, '\n');

const ListPRs = async () => {
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

    // list open PRs in branch
    const prs = await octokit.rest.pulls.list({
      owner,
      repo,
      base,
      state: 'open',
    });

    //filter request to only return matching Ingest UI prefix
  const filteredRequests = prs.data.filter( item => item.title.startsWith(prefix))

    // const titles = prs.data.map(pr => pr.title.replace(prefix, ''));
    const desiredKeys = ['title', 'number', 'head'];

    const result = filteredRequests.map(({ ...obj }) => {
      const newObj = {};
      for (const key of desiredKeys) {
        if (obj.hasOwnProperty(key)) {
          newObj[key] = obj[key];
        }
      }
      return newObj;
    });
    return result;
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

export default ListPRs;
