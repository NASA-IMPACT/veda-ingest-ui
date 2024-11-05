import { Octokit } from "@octokit/rest";


const targetBranch = 'master';

  const octokit = new Octokit({
    auth: authToken,
  });

/**
 * Create a new file on a new branch named after the collection and open a pull request
 *
 * @param {formData} formData
 * @returns {Promise<Object>}
 */
export default async function createNewFile (formData: FormData) {
  const collectionName = formData['collection'];
  // prettify stringify to preserve json formatting
  const content = JSON.stringify(formData, null, 2);
  const targetPath = 'ingestion-data/staging/dataset-config';
  const path = `${targetPath}/${collectionName}.json`;
  const branchName = `feat/${collectionName}`;

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
      tree_sha: sha.data.object.sha
    });
  
    // Create a new blob with the content in formData
    const blob = await octokit.rest.git.createBlob({
      owner,
      repo,
      content,
      encoding: 'utf8',
    });
  
    const newTree = await octokit.rest.git.createTree({
      owner,
      repo,
      tree: [{
        path,
        sha: blob.data.sha,
        mode: '100644',
        type: 'blob'
      }],
      base_tree: tree.data.sha
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
  
    console.log(pr);
  
    return pr
}

interface FormData {
  collection: string;
}

