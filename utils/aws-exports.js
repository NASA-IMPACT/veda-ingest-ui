const config = {
  aws_project_region: 'us-west-2',
  aws_cognito_region: 'us-west-2',
  aws_user_pools_id: process.env.NEXT_PUBLIC_USER_POOL_ID,
  aws_user_pools_web_client_id:
    process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
  oauth: {},
};

export { config };