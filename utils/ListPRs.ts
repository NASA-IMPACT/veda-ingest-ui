import { Octokit } from '@octokit/rest';
import { Endpoints } from '@octokit/types';
import GetGithubToken from './GetGithubToken';

const base = 'main';
const prefix = 'Ingest Request for ';
const owner = process.env.OWNER || '';
const repo = process.env.REPO || '';

const ListPRs = async () => {
  try {
    const token = await GetGithubToken();

    const octokit = new Octokit({
      auth: token,
    });

    // list open PRs in branch
    const response = await octokit.rest.pulls.list({
      owner,
      repo,
      base,
      state: 'open',
    });

    // Type the response data
    const pullRequests: Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'] =
      response.data;

    //filter request to only return matching Ingest UI prefix
    const filteredRequests = pullRequests.filter((item) =>
      item.title.startsWith(prefix)
    );

    return filteredRequests;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default ListPRs;
