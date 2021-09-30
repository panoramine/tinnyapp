const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const morgan = require("morgan")
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');
const { use } = require("chai");


app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['secret key1', 'secret key2']
}));
app.use(morgan("tiny"));


const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("400: email or password cannot be blank");
  }

  const user = findUserByEmail(email);

  if (user) {
    return res.status(400).send("400: user with that email currently exists");
  }

  const id = Math.floor(Math.random() * 5000) + 1;

  const hashedPasswrod = bcrypt.hashSync(password, 10);

  users[id] = {
    id,
    email,
    password: hashedPasswrod
  };

  req.session.user_id = users[id].id;
  
  res.redirect("/urls");
});

app.post("/urls/new", (req, res) => {
  if (req.body.longURL.length === 0) {
    res.redirect("/urls/new");
  } else {
    const tinyString = generateRandomString();
    urlDatabase[tinyString] = {};
    urlDatabase[tinyString].longURL = req.body.longURL;
    urlDatabase[tinyString].userID = req.session.user_id;
    res.redirect(`/urls/${tinyString}`);
  }
});

app.post("/urls/:shortUrl/redirect", (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).send("400: you need to be logged in to edit urls");
  }

  const userUrlDatabase = {};

  for (let shortUrlKey in urlDatabase) {
    if (urlDatabase[shortUrlKey].userID === req.session.user_id) {
      userUrlDatabase[shortUrlKey] = urlDatabase[shortUrlKey].longURL;
    }
  }

  if (!userUrlDatabase[req.params.shortUrl]) {
    return res.status(400).send("400: you can only edit your own urls");
  }
  
  const shortURL = req.params.shortUrl;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortUrl/delete", (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).send("400: you need to be logged in to delete urls");
  }

  const userUrlDatabase = {};

  for (let shortUrlKey in urlDatabase) {
    if (urlDatabase[shortUrlKey].userID === req.session.user_id) {
      userUrlDatabase[shortUrlKey] = urlDatabase[shortUrlKey].longURL;
    }
  }

  if (!userUrlDatabase[req.params.shortUrl]) {
    return res.status(400).send("400: you can only delete your own urls");
  }

  const databaseKey = req.params.shortUrl;
  delete urlDatabase[databaseKey];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  urlDatabase[id].longURL = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("400: email or password cannot be blank");
  }

  const user = findUserByEmail(email);
  console.log("user", user)
  console.log("users", users)
  if (!user) {
    return res.status(403).send("403: e-mail cannot be found");
  }

  if (!bcrypt.compareSync(password, users[user.id].password)) {
    return res.status(403).send("403: password is not a match");
  }

  req.session.user_id = user.id
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL].longURL) {
    return res.status(404).send("404: tiny url not found");
  }

  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).send("400: you need to be logged in to have access to urls");
  }

  const userUrlDatabase = {};

  for (let shortUrlKey in urlDatabase) {
    if (urlDatabase[shortUrlKey].userID === req.session.user_id) {
      userUrlDatabase[shortUrlKey] = urlDatabase[shortUrlKey].longURL;
    }
  }

  const templateVars = { urls: userUrlDatabase, user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };

  if (!templateVars.user) {
    return res.redirect("/login")
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id] };
  
  if (!req.session.user_id) {
    return res.status(400).send("400: you need to be logged in to have access to urls");
  }

  const userUrlDatabase = {};

  for (let shortUrlKey in urlDatabase) {
    if (urlDatabase[shortUrlKey].userID === req.session.user_id) {
      userUrlDatabase[shortUrlKey] = urlDatabase[shortUrlKey].longURL;
    }
  }

  if (!userUrlDatabase[req.params.shortURL]) {
    return res.status(400).send(`400: ${req.params.shortURL} is not one of your short URLs`);
  }

  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

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

const findUserByEmail = function(email) {
  for (let userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

const urlsForUser = function(id) {
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      return urlDatabase[shortURL].longURL;
    }
  }
  return null;
};
