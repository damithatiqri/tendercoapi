'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid');
const moment = require('moment');
const loginHelper = require('../helpers/loginHelper');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = 'TenderCo-Dev-Users';
const VerificationTableName = 'TenderCo-Dev-VerificationCodes';

class user {
  async createUser(model) {
    // validation
    if (!model.Email || !model.Password) {
      console.error('Validation Failed. Required fields are not found.');
      return new Error('Validation Failed. Required fields are not found.');
    }

    const existingUser = await this.getUserByUserName(model.Email);
    if(existingUser){
      throw new Error("User already exists");
    }

    const timestamp = moment.utc().toISOString();
    let passwordHash = await loginHelper.generatePasswordHash(model.Email, model.Password);
    const params = {
      TableName: tableName,
      Item: {
        id: uuid.v1(),
        userName: model.Email,
        name: model.Name,
        email: model.Email,
        mobileNumber: model.MobileNumber,
        country: model.Country,
        status: 'WAITINGFORVERIFICATION',
        passwordHash: passwordHash,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    };

    try {
      // write the pet to the database
      await dynamoDb.put(params).promise();
      return params.Item.id;
    }
    catch (error) {
      console.log("error occured");
      console.log(error);
      throw error;
    }
  }

  async AddVerificationCode(userId, verificationCode) {
    const timestamp = moment.utc().add(1, 'minutes').toISOString();
    const params = {
      TableName: VerificationTableName,
      Item: {
        UserId: userId,
        VerificationCode: verificationCode,
        Expiry: timestamp
      }
    };

    try {
      // write the pet to the database
      const response = await dynamoDb.put(params).promise();
      return response;
    }
    catch (error) {
      console.log("error occured");
      console.log(error);
      return Error(error);
    }
  }

  async verifyUser(userId, verificationCode) {
    const params = {
      TableName: VerificationTableName,
      Key: {
        UserId: userId,
      },
      ExpressionAttributeValues: {
        ':VerificationCode': verificationCode
      },
      FilterExpression: 'VerificationCode = :VerificationCode',
    };

    try {
      // write the pet to the database
      const response = await dynamoDb.get(params).promise();
      if (response.Item) {
        const now = new Date(moment.utc().toISOString());
        const expiry = new Date(response.Item.Expiry);

        if (now < expiry) {
          await this.updateStatus(userId, "VERIFIED");
          return true;
        }
      }
      return false;
    }
    catch (error) {
      console.log("error occured");
      console.log(error);
      return Error(error);
    }
  }

  async updateStatus(userId, status) {
    const timestamp = moment.utc().toISOString();

    const params = {
      TableName: tableName,
      Key: {
        id: userId,
      },
      UpdateExpression: "set #status = :status_value, updatedAt=:timestamp",
      ExpressionAttributeValues: {
        ":status_value": status,
        ":timestamp": timestamp,
      },
      ExpressionAttributeNames: {
        "#status": "status"
      }
    };
    await dynamoDb.update(params).promise();
  }

  async getUser(userId) {
    const params = {
      TableName: tableName,
      Key: {
        id: userId,
      }
    };

    try {
      const response = await dynamoDb.get(params).promise();
      return response.Item;
    }
    catch (error) {
      console.log("error occured");
      console.log(error);
      return Error(error);
    }
  }

  async getUserByUserName(userName) {
    const params = {
      ExpressionAttributeValues: {
        ':userName': userName
      },
      FilterExpression: 'userName = :userName',
      TableName: tableName,
    };

    try {
      const response = await dynamoDb.scan(params).promise();
      return response.Items[0];
    }
    catch (error) {
      console.log("error occured");
      console.log(error);
      return Error(error);
    }
  }

  async login(model) {
    const params = {
      ExpressionAttributeValues: {
        ':userNameVal': model.UserName
      },
      FilterExpression: 'userName = :userNameVal',
      TableName: tableName,
    };

    try {
      const response = await dynamoDb.scan(params).promise();
      console.log(response);
      if(!response.Items || !response.Items[0]){
        throw Error("User not found");
      }
      const user = response.Items[0];
      let passwordHash = loginHelper.generatePasswordHash(model.UserName, model.Password);
      if(passwordHash === user.passwordHash){
        throw Error("Invalid credentials");
      }
      return user;
    }
    catch (error) {
      console.log("error occured");
      console.log(error);
      return Error(error);
    }
  }
}

module.exports = user;
