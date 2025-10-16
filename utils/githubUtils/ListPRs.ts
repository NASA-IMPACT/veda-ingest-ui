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

const ListPRs = async (
  ingestionType: IngestionType
): Promise<IngestPullRequest[]> => {
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
            const parsedContent = JSON.parse(fileContent);
            return { pr, tenant: parsedContent.tenant };
          } catch (e) {
            console.error(`Failed to parse JSON for PR #${pr.number}`);
            return { pr, tenant: undefined };
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
