var jwt = require('jsonwebtoken');

const secret = "xA6TULrNCbVl6O5LW75c52miA5R1dLz9Xf_I9elbzcLJ6-WtHqmNx45aG2OxM856a21NQMU2fU0Rz13rH6vSJcg_5Fjb_DXKVP00ZkRJY3yMmwuen-JBvgFqGbWA1t94AaLDngeVOBgiRt9zYjpVB3MUQwkDB86Dc8g09KuNVLmw4ZfxxhyzZNBlMIXZWUopzDaWyDBq30VFvhoiLy3softSqTPrV4MXIAgLWE6bvFcA64qy6VMVYrz5HJaH9kKBFx0EnyFP4EjM2tCqQLZUkNxUFY_h3dw6WhGb34ss4iRpHpHDg5F1CtZVSa4_wbSFwmCmlgjDmv46WkdHhjYHEw";

module.exports.getAccessToken = async function (userId) {
  try {
    var token = jwt.sign({
        userId: userId
      }, secret, { expiresIn: '30d' });
    return token;
  }
  catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports.generatePasswordHash = async function (userName, password) {
  try {
    let passwordHash = Buffer.from(userName + password).toString("base64");
    console.log(passwordHash);
    return passwordHash;
  }
  catch (error) {
    console.log(error);
    throw error;
  }
};
