import { Octokit } from '@octokit/rest';
import { RequestError } from '@octokit/request-error';
import { createAppAuth } from '@octokit/auth-app';


const targetPath = 'ingestion-data/staging/dataset-config';
const owner = process.env.OWNER || '';
const repo = process.env.REPO || '';
const appId = parseInt(process.env.APP_ID || '');
const installationId = parseInt(process.env.INSTALLATION_ID || '');
const rawkey = process.env.GITHUB_PRIVATE_KEY || '';

const privateKey = rawkey.replace(/\\n/g, '\n');

const RetrieveJSON = async (ref: string) => {
  const fileName = ref.replace('feat/', '');
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
    const json = await octokit.rest.repos.getContent({
      owner,
      repo,
      ref: ref,
      path: `${targetPath}/${fileName}.json`,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const sha = json.data['sha'];
    const contentBase64 = json.data['content'];

    const buffer = Buffer.from(contentBase64, 'base64');

    // Convert buffer to string and parse to JSON
    const jsonString = buffer.toString('utf-8');
    const content = JSON.parse(jsonString);

    return {sha, content };
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

export default RetrieveJSON;
