const { assert } = require('chai');

const helper = require('../helpers.js');

const getUserByEmail = helper.findUserByEmail

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers).id;
    const expectedOutput = "userRandomID";
    assert.equal(user, expectedOutput);
  });

  it('should return undefined if the email is not in the users database', function() {
    const user = getUserByEmail("random@email.com", testUsers);
    assert.isUndefined(user);
  });
});