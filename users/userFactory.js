const user = require('./user')

const userFactory = function () {
    return new user();
}

module.exports = userFactory