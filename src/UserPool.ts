import {
  CognitoUserPool,
  ICognitoUserPoolData,
} from 'amazon-cognito-identity-js';

const poolData: ICognitoUserPoolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
};

export default new CognitoUserPool(poolData);
