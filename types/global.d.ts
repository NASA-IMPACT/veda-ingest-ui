export type Status =
  | 'idle'
  | 'loadingGithub'
  | 'loadingIngest'
  | 'loadingPRs'
  | 'success'
  | 'error';
