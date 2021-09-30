const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');


app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

  users[id] = {
    id,
    email,
    password
  };

  res.cookie("user_id", users[id].id);
  
  res.redirect("/urls");
});

app.post("/urls/new", (req, res) => {
  if (req.body.longURL.length === 0) {
    res.redirect("/urls/new");
  } else {
    const tinyString = generateRandomString();
    urlDatabase[tinyString] = req.body.longURL;   //console.log(urlDatabase) new pair key value is added
    res.redirect(`/urls/${tinyString}`);
  }
});

app.post("/urls/:shortUrl/redirect", (req, res) => {
  const shortURL = req.params.shortUrl;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortUrl/delete", (req, res) => {
  const databaseKey = req.params.shortUrl;
  delete urlDatabase[databaseKey];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("400: email or password cannot be blank");
  }

  const user = findUserByEmail(email);
  console.log(user);
  if (!user) {
    return res.status(403).send("403: e-mail cannot be found");
  }

  if (user.password !== password) {
    return res.status(403).send("403: password is not a match");
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  if (!templateVars.user) {
    return res.redirect("/login")
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
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