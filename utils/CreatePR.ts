import { Octokit } from '@octokit/rest';
import { RequestError } from '@octokit/request-error';
import { createAppAuth } from '@octokit/auth-app';

const targetBranch = 'master';
const owner = process.env.OWNER || '';
const repo = process.env.REPO || '';
const appId = parseInt(process.env.APP_ID || '');
const installationId = parseInt(process.env.INSTALLATION_ID || '');
const privateKey = process.env.GITHUB_PRIVATE_KEY || '';

const CreatePR = async (data: unknown) => {
  try {
    // const data = req.body;
    console.log(data)
    console.log('pr creating data type of', typeof data)
    //@ts-expect-error testing
    const collectionName = data['collection'];
    console.log('collectionName', collectionName)
    // prettify stringify to preserve json formatting
    // const content = JSON.stringify(data, null, 2);
    const content = data;
    const targetPath = 'ingestion-data/staging/dataset-config';
    const fileName = collectionName;
    const path = `${targetPath}/${fileName}.json`;
    const branchName = `feat/${fileName}`;

    const appOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey,
        installationId,
      },
    });

    // @ts-expect-error due to token type not defined on octokit
    const { token } = await appOctokit.auth({
      type: 'installation',
      installationId,
    });

    const octokit = new Octokit({
      auth: token,
    });

    // Get the current target branch reference to get the sha
    const sha = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${targetBranch}`,
    });

    // Get the tree associated with master, and the content
    // of the template file to open the PR with.
    const tree = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: sha.data.object.sha,
    });

    // Create a new blob with the content in formData
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

    // Create a commit and a reference using the new tree
    const newCommit = await octokit.rest.git.createCommit({
      owner,
      repo,
      message: `Create ${path}`,
      tree: newTree.data.sha,
      parents: [sha.data.object.sha],
    });

    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: newCommit.data.sha,
    });

    // open PR with new file added to targetBranch
    const pr = await octokit.rest.pulls.create({
      owner,
      repo,
      head: branchName,
      base: targetBranch,
      title: `Create ${path}`,
    });

    const pr_url = pr.data.html_url;
    console.log(`PR opened at URL ${pr_url}`);
    return pr_url;
  } catch (error) {
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

export default CreatePR;