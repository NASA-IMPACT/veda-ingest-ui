import { Octokit } from '@octokit/rest';
import { Endpoints } from '@octokit/types';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';
import { IngestPullRequest } from '@/types/ingest';

const base = process.env.TARGET_BRANCH || 'main';
const owner = process.env.OWNER || '';
const repo = process.env.REPO || '';

const TARGET_PATHS = {
  collection: 'ingestion-data/staging/collections/',
  dataset: 'ingestion-data/staging/dataset-config/',
};

type IngestionType = 'collection' | 'dataset';

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
): Promise<IngestPullRequest[]> => {
  // Ensure the return type is correct
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

      const matchingFile = files.find(
        (file) =>
          file.filename.startsWith(targetPath) &&
          file.filename.endsWith('.json')
      );

      if (matchingFile) {
        // If a file matches, fetch its content from the PR's branch
        const { data: contentData } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: matchingFile.filename,
          ref: pr.head.sha,
        });

        if ('content' in contentData) {
          const fileContent = Buffer.from(
            contentData.content,
            'base64'
          ).toString('utf-8');
          try {
            return { pr, content: JSON.parse(fileContent) };
          } catch (e) {
            console.error(`Failed to parse JSON for PR #${pr.number}`);
            return { pr, content: null };
          }
        }
      }
      return null;
    });

    const results = await Promise.all(checkFilePromises);

    // Filter out any PRs that didn't have a matching or valid file
    return results.filter(
      (ingest): ingest is IngestPullRequest => ingest !== null
    );
  } catch (error) {
    console.error('Failed to list pull requests:', error);
    throw error;
  }
};

export default ListPRs;
