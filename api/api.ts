import express, { Router, Request, Response } from 'express'

import fs from 'fs';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

const key = fs.readFileSync('./private-key.pem', 'utf-8');

dotenv.config();

const targetBranch = 'master';
const owner = process.env.OWNER || '';
const repo = process.env.REPO || '';
const appId = parseInt(process.env.APP_ID || '');
const installationId = parseInt(process.env.INSTALLATION_ID || '');


class Api {
  public router: Router = express.Router()

  constructor() {
    this.setupRoutes()
  }

  private setupRoutes() {
    this.router.post('/ingest', this.postIngest)
    // Add more routes here as needed

    // catch all 404 for everything
    this.router.use('*', (req, res) => {
      res.status(404).send(`${req.originalUrl || req.url} not found`)
    })
  }

  private postIngest = async (req: Request, res: Response) => {
    try {
      const data = req.body;

      const collectionName = data['collection'];
      // prettify stringify to preserve json formatting
      const content = JSON.stringify(data, null, 2);
      const targetPath = 'ingestion-data/staging/dataset-config';
      const fileName = collectionName;
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
  }

  // returns a list of all the routes defined in the router
  public listRoutes(): string[] {
    return this.router.stack
      .filter(r => r.route)
      .map(r => r.route!.path);
  }
}

export default new Api();
