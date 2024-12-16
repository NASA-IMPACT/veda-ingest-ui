import { Octokit } from '@octokit/rest';
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

    // renaming to clarify file vs branch sha and path
    // @ts-expect-error data has sha, content, and path
    const fileSha = json.data['sha'];
    // @ts-expect-error data has sha, content, and path
    const contentBase64 = json.data['content'];
    // @ts-expect-error data has sha, content, and path
    const filePath = json.data['path']


    const buffer = Buffer.from(contentBase64, 'base64');

    // Convert buffer to string and parse to JSON
    const jsonString = buffer.toString('utf-8');
    const content = JSON.parse(jsonString);
    return {fileSha,filePath, content };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export default RetrieveJSON;
