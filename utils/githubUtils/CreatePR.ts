import { createOctokit } from './OctokitFactory';
import { RequestError } from '@octokit/request-error';
import { formatFilename } from '@/utils/FormatFilename';
import GetGithubToken from './GetGithubToken';

interface Data {
  collection: string;
  [key: string]: unknown;
}

const CreatePR = async (data: Data): Promise<string> => {
  const targetBranch = process.env.TARGET_BRANCH || 'main';
  const owner = process.env.OWNER;
  const repo = process.env.REPO;

  if (!owner || !repo) {
    throw new Error('Missing required environment variables: OWNER or REPO');
  }

  try {
    const collectionName = data.collection;
    const content = JSON.stringify(data, null, 2);
    const targetPath = 'ingestion-data/staging/dataset-config';
    const fileName = formatFilename(collectionName);
    const path = `${targetPath}/${fileName}.json`;
    const branchName = `feat/${fileName}`;

    const token = await GetGithubToken();
    const octokit = createOctokit(token);

    const sha = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${targetBranch}`,
    });

    const tree = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: sha.data.object?.sha,
    });

    const blob = await octokit.rest.git.createBlob({
      owner,
      repo,
      content,
      encoding: 'utf-8',
    });

    const newTree = await octokit.rest.git.createTree({
      owner,
      repo,
      tree: [
        {
          path,
          sha: blob.data.sha,
          mode: '100644',
          type: 'blob',
        },
      ],
      base_tree: tree.data.sha,
    });

    const newCommit = await octokit.rest.git.createCommit({
      owner,
      repo,
      message: `Create ${path}`,
      tree: newTree.data.sha,
      parents: [sha.data.object?.sha],
    });

    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: newCommit.data.sha,
    });

    const pr = await octokit.rest.pulls.create({
      owner,
      repo,
      head: branchName,
      base: targetBranch,
      title: `Ingest Request for ${collectionName}`,
    });

    return pr.data.html_url;
  } catch (error) {
    console.error(error);
    if (error instanceof RequestError) {
      if (error.status === 422 && error.response?.data) {
        const errorMessage = (error.response.data as { message?: string }).message || 'Unknown error';
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
    }
    throw error;
  }
};


export default CreatePR;
