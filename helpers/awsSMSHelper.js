var AWS = require('aws-sdk');


module.exports.sendMessage = async function (toNumber, message, callback) {
  var params = {
    Message: message,
    PhoneNumber: toNumber
  };

  try {
    var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();
    console.log(publishTextPromise);
    return publishTextPromise.MessageId;
  }
  catch (error) {
    console.log(error);
    throw error;
  }
  // Handle promise's fulfilled/rejected states
  // publishTextPromise
  //   .then(function (data) {
  //     console.log('MessageID is ' + data.MessageId);
  //     return callback(null, 'Message sent successfully.');
  //   })
  //   .catch(function (err) {
  //     console.error(err, err.stack);
  //     return callback(err, err.stack);
  //   });
};
