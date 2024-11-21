import fs from 'fs';
import dotenv from 'dotenv';
import express from 'express';
import ViteExpress from 'vite-express';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { formatFilename } from './utils/utils.js';
const key = fs.readFileSync('./private-key.pem', 'utf-8');

dotenv.config();

const targetBranch = 'master';
const owner = process.env.OWNER;
const repo = process.env.REPO;
const appId = parseInt(process.env.APP_ID);
const installationId = parseInt(process.env.INSTALLATION_ID);

const app = express();
app.use(express.json());

app.post('/ingest', async (req, res) => {
  try {
    const data = req.body;

    const collectionName = data['collection'];
    // prettify stringify to preserve json formatting
    const content = JSON.stringify(data, null, 2);
    const targetPath = 'ingestion-data/staging/dataset-config';
    const fileName = formatFilename(collectionName);
    const path = `${targetPath}/${fileName}.json`;
    const branchName = `feat/${fileName}`;

    const appOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey: key,
        installationId,
      },
    });

    const { token } = await appOctokit.auth({
      type: 'installation',
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
      encoding: 'utf8',
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

    res.status(201).send({
      message: 'Data received successfully',
      data: pr.data.html_url,
    });
  } catch (error) {
    console.error(error);
    // branch with branchName already exists
    if (error['status'] === 422 && error.response.data.message) {
      return res.status(400).json({ error: error.response.data.message });
    }
    // other errors leave as general server error
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

ViteExpress.listen(app, 3000, () => console.log('Server is listening...'));
