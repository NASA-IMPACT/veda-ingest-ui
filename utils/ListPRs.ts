import { Octokit } from '@octokit/rest';
import GetGithubToken from './GetGithubToken';

const base = 'master';
const prefix = 'Ingest Request for ';
const owner = process.env.OWNER || '';
const repo = process.env.REPO || '';


const ListPRs = async () => {
  try {

    const token = await GetGithubToken()
    

    const octokit = new Octokit({
      auth: token,
    });

    // list open PRs in branch
    const prs = await octokit.rest.pulls.list({
      owner,
      repo,
      base,
      state: 'open',
    });

  //filter request to only return matching Ingest UI prefix
  const filteredRequests = prs.data.filter( item => item.title.startsWith(prefix))

    const desiredKeys = ['title', 'number', 'head'];

    const result = filteredRequests.map(({ ...obj }) => {
      const newObj = {};
      for (const key of desiredKeys) {
        if (obj.hasOwnProperty(key)) {
           // @ts-expect-error desired keys are all in filtered requests, so need to set types
           newObj[key] = obj[key];
        }
      }
      return newObj;
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default ListPRs;
