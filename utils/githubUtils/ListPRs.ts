import { Octokit } from '@octokit/rest';
import { Endpoints } from '@octokit/types';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';

const base = process.env.TARGET_BRANCH || 'main';
const owner = process.env.OWNER || '';
const repo = process.env.REPO || '';

// Define the directory paths for collections and datasets.
const TARGET_PATHS = {
  collection: 'ingestion-data/staging/collections/',
  dataset: 'ingestion-data/staging/dataset-config/',
};

type IngestionType = 'collection' | 'dataset';
type PullRequest =
  Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'][0];

/**
 * Lists open pull requests that contain changes to files in a specific directory
 * based on the ingestion type.
 *
 * @param ingestionType - The type of ingestion, determines which directory to check for file changes.
 * @returns A promise that resolves to an array of pull request objects.
 * @throws An error if the ingestionType parameter is missing or invalid.
 */
const ListPRs = async (
  ingestionType: IngestionType
): Promise<PullRequest[]> => {
  // Validate the ingestionType parameter.
  if (!ingestionType || !TARGET_PATHS[ingestionType]) {
    throw new Error(
      'ingestionType parameter is required and must be either "collection" or "dataset".'
    );
  }

  try {
    const token = await GetGithubToken();
    const octokit = new Octokit({ auth: token });
    const targetPath = TARGET_PATHS[ingestionType];

    // 1. List all open pull requests against the base branch.
    const { data: pullRequests } = await octokit.rest.pulls.list({
      owner,
      repo,
      base,
      state: 'open',
    });

    // 2. Create an array of promises to check the files for each pull request.
    const checkFilePromises = pullRequests.map(async (pr) => {
      const { data: files } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: pr.number,
      });

      // 3. Check if any file in the PR matches the target directory and extension.
      const hasMatchingFile = files.some(
        (file) =>
          file.filename.startsWith(targetPath) &&
          file.filename.endsWith('.json')
      );

      // Return the pull request if it matches, otherwise null.
      return hasMatchingFile ? pr : null;
    });

    // 4. Wait for all the file checks to complete.
    const results = await Promise.all(checkFilePromises);

    // 5. Filter out the null results to get the final list of matching pull requests.
    const filteredRequests = results.filter(
      (pr): pr is PullRequest => pr !== null
    );

    return filteredRequests;
  } catch (error) {
    console.error('Failed to list pull requests:', error);
    throw error;
  }
};

export default ListPRs;
