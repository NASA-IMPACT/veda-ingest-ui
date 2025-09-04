import { Endpoints } from '@octokit/types';

// This is the raw Pull Request type from the Octokit library
type GitHubPullRequest =
  Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'][0];

/**
 * Defines the shape of an ingest object, which includes both the
 * original pull request data and the parsed content of its JSON file.
 */
export interface IngestPullRequest {
  pr: GitHubPullRequest;
  content: Record<string, any> | null;
}
