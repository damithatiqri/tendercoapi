var express = require('express');
const userFactory = require('./userFactory');
const smsHelper = require('../helpers/awsSMSHelper');
const loginHelper = require('../helpers/loginHelper');
const corsHelper = require('../helpers/corsHelper')
var router = express.Router();

router.post('/registerUser', async (req, res) => {
  console.log('test');
  corsHelper.enableCors(res);
  const { name, email, mobileNumber, password, country } = req.body;
  const VerificationCode = "" + Math.floor(Math.random() * 1000000);
  const model = {
    UserName: email,
    Email: email,
    Name: name,
    MobileNumber: mobileNumber,
    Password: password,
    Country: country
  };

  const userFact = new userFactory();

  try {
    const userId = await userFact.createUser(model);
    console.log(userId);
    const messageId = smsHelper.sendMessage(mobileNumber, 'Your verification code: ' + VerificationCode);
    console.log(messageId);
    const response = await userFact.AddVerificationCode(userId, VerificationCode);
    res.status(200).json({
      userId: userId,
      mobileNumber: model.MobileNumber
    });
  }
  catch (error) {
    console.log(error);
    res.status(404).json({ data: null, message: error.message });
  }
});

router.put('/verifyCode', async (req, res) => {
  const { userId, verificationCode } = req.body;

  try {
    const userFact = new userFactory();
    const isVerified = await userFact.verifyUser(userId, verificationCode);
    console.log(isVerified);
    if (isVerified === true) {
      const token = await loginHelper.getAccessToken(userId);
      const response = {
        userId: userId,
        accessToken: JSON.stringify(token)
      };
      res.status(200).json(response);
      return;
    }
    else {
      res.status(401).json({ data: null, message: "Invalid Verification Code" });
      return;
    }
  }
  catch (error) {
    console.log(error);
    res.status(404).json({ data: null, message: error });
  }
});

router.put('/resendVerificationCode', async (req, res) => {
  const { userId } = req.body;

  const userFact = new userFactory();

  try {
    const verificationCode = "" + Math.floor(Math.random() * 1000000);
    const user = await userFact.getUser(userId);

    const messageId = smsHelper.sendMessage(user.mobileNumber, 'Your verification code: ' + verificationCode);
    const response = await userFact.AddVerificationCode(userId, verificationCode);
  }
  catch (error) {
    console.log(error);
    res.status(404).json({ data: null, message: error });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const model = {
    UserName: username,
    Password: password,
  };

  const userFact = new userFactory();

  try {
    console.log(model);
    const user = await userFact.login(model);
    console.log(user);

    const VerificationCode = "" + Math.floor(Math.random() * 1000000);
    const messageId = smsHelper.sendMessage(user.mobileNumber, 'Your verification code: ' + VerificationCode);
    console.log(messageId);

    const response = await userFact.AddVerificationCode(user.id, VerificationCode);
    res.status(200).json({
      userId: user.id,
      mobileNumber: user.mobileNumber
    });
  }
  catch (error) {
    console.log(error);
    res.status(404).json({ data: null, message: error });
  }
});

router.get('/single', async (req, res) => {
  res.status(200).json({
    message: 'User Registered Successfully'
  });
});

module.exports = router;
