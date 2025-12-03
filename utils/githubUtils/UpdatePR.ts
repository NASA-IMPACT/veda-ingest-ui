import { Octokit } from '@octokit/rest';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';
import { CleanAndPrettifyJSON } from '../CleanAndPrettifyJson';

const UpdatePR = async (
  gitRef: string,
  fileSha: string,
  filePath: string,
  formData: any
) => {
  // prettify stringify to preserve json formatting
  const stringContent = CleanAndPrettifyJSON(formData);
  const content = btoa(stringContent);

  const { OWNER: owner, REPO: repo } = await import('@/config/env').then(
    (m) => m.cfg
  );

  if (!owner || !repo) {
    throw new Error('Missing required environment variables: OWNER or REPO');
  }

  console.log(`updating ${gitRef}`);
  try {
    const token = await GetGithubToken();

    const octokit = new Octokit({
      auth: token,
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      branch: gitRef,
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
