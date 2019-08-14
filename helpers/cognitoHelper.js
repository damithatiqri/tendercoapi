const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const aws = require('aws-sdk');
global.fetch = require('node-fetch');

const poolData = {
    UserPoolId: /*process.env.USER_POOL_ID*/'ap-southeast-2_XWSJ3SJQT',
    ClientId: /*process.env.ADMIN_APP_CLIENT_ID*/'7bn9vkbf1aimq2ah94v5vk9e4d'
};
const adminUserGroup = /*process.env.ADMIN_USER_GROUP*/'';
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
const cognitoidentityserviceprovider = new aws.CognitoIdentityServiceProvider();

module.exports.registerUser = (model, callback) => {
    console.log(model);
    if (!model.Name || !model.Email || !model.MobileNumber || !model.Password) {
        console.error('Validation Failed. Required fields are not found.');
        callback(new Error('Validation Failed. Required fields are not found.'));
        return;
    }

    var attributeList = [];
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "name", Value: model.Name }));
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "email", Value: model.Email }));
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "phone_number", Value: model.MobileNumber }));

    var confirmParams = {
        UserPoolId: poolData.UserPoolId, /* required */
        Username: model.Email /* required */
    };

    userPool.signUp(model.Email, model.Password, attributeList, null, function (err, result) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }
        console.log(result);
        console.log('user created in cognito with username ' + model.Email);
        console.log('Starting to confirm user with username ' + model.Email);

        // cognitoidentityserviceprovider.adminConfirmSignUp(confirmParams, function (err, data) {
        //     if (err) {
        //         console.log(err);
        //         callback(err);
        //         return;
        //     }

        //     cognitoUser = result.user;
        //     cognitoUser.sub = result.userSub;
        //     console.log('user confirmed in cognito with username ' + cognitoUser.getUsername());
        //     callback(null, cognitoUser);
        // });
    });
};

module.exports.updateUser = (model, callback) => {
    if (!model.Name || !model.Email || !model.MobileNumber) {
        console.error('Validation Failed. Required fields are not found.');
        callback(new Error('Validation Failed. Required fields are not found.'));
        return;
    }

    var params = {
        UserAttributes: [
            {
                Name: 'name',
                Value: model.Name
            },
            {
                Name: 'phone_number',
                Value: model.MobileNumber
            },
            {
                Name: 'custom:full_name',
                Value: model.Name
            }
        ],
        UserPoolId: poolData.UserPoolId,
        Username: model.Email
    };
    cognitoidentityserviceprovider.adminUpdateUserAttributes(params, function (err, data) {
        if (err) {
            console.log(err, err.stack);
            callback(err);
            return;
        }
        else {
            console.log(data);
            console.log('user update in cognito');
            callback(null, data);
        }
    });
};

module.exports.adminLogin = (model, callback) => {
    if (!model.Username || !model.Password) {
        console.error('Validation Failed. Required fields are not found.');
        callback(new Error('Validation Failed. Required fields are not found.'));
        return;
    }

    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: model.Username,
        Password: model.Password,
    });

    var userData = {
        Username: model.Username,
        Pool: userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            console.log('access token + ' + result.getAccessToken().getJwtToken());
            console.log('id token + ' + result.getIdToken().getJwtToken());
            console.log('refresh token + ' + result.getRefreshToken().getToken());
            console.log('user logged in successfully with cognito');

            var resModel = {
                "access_token": result.getAccessToken().getJwtToken(),
                "id_token": result.getIdToken().getJwtToken(),
                "refresh_token": result.getRefreshToken().getToken()
            };

            var params = {
                UserPoolId: poolData.UserPoolId, /* required */
                Username: model.Username, /* required */
                Limit: 10
            };

            cognitoidentityserviceprovider.adminListGroupsForUser(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                    callback(err);
                    return;
                }
                else {
                    console.log(data);
                    for (i = 0; i < data.Groups.length; i++) {
                        if (data.Groups[i].GroupName == adminUserGroup) {
                            callback(null, resModel);
                            return;
                        }
                    }
                }

                callback(new Error('Authorization failed.'));
            });
        },
        onFailure: function (err) {
            console.log(err);
            callback(err);
            return;
        }
    });
};

module.exports.refreshToken = (model, callback) => {
    if (!model.RefreshToken) {
        console.error('Validation Failed. Required fields are not found.');
        callback(new Error('Validation Failed. Required fields are not found.'));
        return;
    }

    const RefreshToken = new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: model.RefreshToken });
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const userData = {
        Username: model.Username,
        Pool: userPool
    };

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.refreshSession(RefreshToken, (err, session) => {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        let resModel = {
            "access_token": session.accessToken.jwtToken,
            "id_token": session.idToken.jwtToken,
            "refresh_token": session.refreshToken.token,
        }
        console.log(resModel);
        callback(null, resModel);
    });
};

module.exports.deleteUser = (model, callback) => {
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: model.Email,
        Password: model.Password,
    });

    var userData = {
        Username: model.Email,
        Pool: userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            console.log("Successfully authenticated the user.");
            cognitoUser.deleteUser((err, result) => {
                if (err) {
                    console.log(err);
                    callback(err);
                    return;
                } else {
                    console.log("Successfully deleted the user.");
                    console.log(result);
                    callback(null, result);
                }
            });
        },
        onFailure: function (err) {
            console.log(err);
            callback(err);
            return;
        },
    });
}