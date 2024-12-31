import { Octokit } from '@octokit/rest';
import GetGithubToken from './GetGithubToken';

const UpdatePR = async (
  ref: string,
  fileSha: string,
  filePath: string,
  formData: any
) => {
  // prettify stringify to preserve json formatting
  const stringContent = JSON.stringify(formData, null, 2);
  const content = btoa(stringContent);

  const owner = process.env.OWNER;
  const repo = process.env.REPO;

  if (!owner || !repo) {
    throw new Error('Missing required environment variables: OWNER or REPO');
  }

  try {
    const token = await GetGithubToken();

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
    });

    return;
  } catch (error) {
    console.error('Unexpected Error:', error);
    throw error;
  }
};

export default UpdatePR;
