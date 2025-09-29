import { Endpoints } from '@octokit/types';

// This is the raw Pull Request type from the Octokit library
type GitHubPullRequest =
  Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'][0];

/**
 * Defines the shape of an ingest object, which includes the
 * pull request data and its associated tenants array.
 */
export interface IngestPullRequest {
  pr: GitHubPullRequest;
  tenant: string | undefined;
}
