const generateRandomString = function() {
  let chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let charsArray = chars.split("");
  let tinyUrl = "";
  for (let i = 0; i < 6; i ++) {
    let randomIndex = Math.floor(Math.random() * charsArray.length);
    tinyUrl += charsArray[randomIndex];
  }
  return tinyUrl;
};

const findUserByEmail = function(email, database) {
  for (let userId in database) {
    const user = database[userId];
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
};

const urlsForUser = function(id, database) {
  for (let shortURL in database) {
    if (database[shortURL].userID === id) {
      return database[shortURL].longURL;
    }
  }
  return null;
};

const createUserUrlDatabase = function(database, userCookie) {
  const userUrlDatabase = {};

  for (let shortUrlKey in database) {
    if (database[shortUrlKey].userID === userCookie) {
      userUrlDatabase[shortUrlKey] = database[shortUrlKey].longURL;
    }
  }
  return userUrlDatabase;
};

module.exports = { generateRandomString, findUserByEmail, urlsForUser, createUserUrlDatabase };