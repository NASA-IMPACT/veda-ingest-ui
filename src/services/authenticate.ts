import { AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';
import userpool from '../UserPool';

export const authenticate=(Email: string,Password: string)=>{
    return new Promise((resolve,reject)=>{
        const user=new CognitoUser({
            Username:Email,
            Pool:userpool
        });

        const authDetails= new AuthenticationDetails({
            Username:Email,
            Password
        });

        user.authenticateUser(authDetails,{
            onSuccess:(result)=>{
                console.log("login successful");
                resolve(result);
            },
            onFailure:(err)=>{
                console.log("login failed",err);
                reject(err);
            }
        });
    });
};

export const logout = () => {
    const user = userpool.getCurrentUser();
    if(user){
      user.signOut();
    }
    window.location.href = '/';
};