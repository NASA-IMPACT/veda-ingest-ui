import { Octokit } from '@octokit/rest';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';

const targetPath = 'ingestion-data/staging/dataset-config';

const RetrieveJSON = async (ref: string) => {
  const owner = process.env.OWNER;
  const repo = process.env.REPO;

  if (!owner || !repo) {
    throw new Error('Missing required environment variables: OWNER or REPO');
  }

  const fileName = ref.replace('feat/', '');

  try {
    const token = await GetGithubToken();

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
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    // renaming to clarify file vs branch sha and path
    // @ts-expect-error data has sha, content, and path
    const fileSha = json.data['sha'];
    // @ts-expect-error data has sha, content, and path
    const contentBase64 = json.data['content'];
    // @ts-expect-error data has sha, content, and path
    const filePath = json.data['path'];

    const buffer = Buffer.from(contentBase64, 'base64');

    // Convert buffer to string and parse to JSON
    const jsonString = buffer.toString('utf-8');
    const content = await JSON.parse(jsonString);
    return { fileSha, filePath, content };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default RetrieveJSON;
