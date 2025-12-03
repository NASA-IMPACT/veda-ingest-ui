import { Octokit } from '@octokit/rest';
import GetGithubToken from '@/utils/githubUtils/GetGithubToken';

type IngestionType = 'collection' | 'dataset';

const RetrieveJSON = async (ref: string, ingestionType: IngestionType) => {
  const { OWNER: owner, REPO: repo } = await import('@/config/env').then(
    (m) => m.cfg
  );

  if (!owner || !repo) {
    throw new Error('Missing required environment variables: OWNER or REPO');
  }

  let targetPath: string;
  if (ingestionType === 'dataset') {
    targetPath = 'ingestion-data/staging/dataset-config';
  } else if (ingestionType === 'collection') {
    targetPath = 'ingestion-data/staging/collections';
  } else {
    throw new Error(`Invalid ingestionType provided: ${ingestionType}`);
  }

  // The filename is derived from the branch name ('ref').
  const fileName = ref.replace('feat/', '');
  const fullPath = `${targetPath}/${fileName}.json`;

  try {
    const token = await GetGithubToken();
    const octokit = new Octokit({ auth: token });

    // Get the content of the specified file from the repository.
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      ref: ref,
      path: fullPath,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    // Type guard to ensure the response is a file and not a directory or other content type.
    if (Array.isArray(fileData) || !('content' in fileData)) {
      throw new Error(`The path "${fullPath}" does not point to a file.`);
    }

    // Extract content and metadata from the response.
    const fileSha = fileData.sha;
    const contentBase64 = fileData.content;
    const filePath = fileData.path;

    // Decode the Base64 content to a string.
    const buffer = Buffer.from(contentBase64, 'base64');
    const jsonString = buffer.toString('utf-8');

    // Safely parse the string into a JSON object.
    let content;
    try {
      content = JSON.parse(jsonString);
    } catch (parseError) {
      throw new Error(`Invalid JSON format in GitHub file: ${filePath}`);
    }

    return { fileSha, filePath, content };
  } catch (error) {
    console.error(error);
    // Re-throw the error to be handled by the calling API route.
    throw error;
  }
};

export default RetrieveJSON;
