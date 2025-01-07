import { Octokit } from '@octokit/rest';

export const createOctokit = (token: string) => {
  return new Octokit({ auth: token });
};
