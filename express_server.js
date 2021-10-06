const express = require("express");
const app = express();
const PORT = 8080;
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
var methodOverride = require('method-override');
const helper = require("./helpers");
const generateRandomString = helper.generateRandomString;
const findUserByEmail = helper.findUserByEmail;
const createUserUrlDatabase = helper.createUserUrlDatabase;


app.use(methodOverride('_method'));
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
  //checks if user is logged in and redirects to urls page if so and to the login page if not
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/register", (req, res) => {
  // if there is a session
  if (req.session.user_id) {
    res.redirect("/urls");
  } else { //if there is not
    res.render("register");
  }
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //checking for blank fields
  if (!email || !password) {
    return res.status(400).send("400: email or password cannot be blank, <a href='/register'>back to register</a>");
  }

  const user = findUserByEmail(email, users);

  //checking if the e-mail is already in use
  if (user) {
    return res.status(400).send("400: user with that email currently exists, <a href='/register'>back to register</a>");
  }

  const id = Math.floor(Math.random() * 5000) + 1;

  //password if hashed before storage
  const hashedPasswrod = bcrypt.hashSync(password, 10);

  users[id] = {
    id,
    email,
    password: hashedPasswrod
  };

  //creates cookie
  req.session.user_id = users[id].id;
  
  res.redirect("/urls");
});

app.post("/urls/new", (req, res) => {
  //redirect user that is not logged in
  if (!req.session.user_id) {
    res.redirect("/login")
  }

  //avoid the submission of a blank url
  if (req.body.longURL.length === 0) {
    res.redirect("/urls/new");
  } else { //enters data to the database
    const tinyString = generateRandomString();
    urlDatabase[tinyString] = {};
    urlDatabase[tinyString].longURL = req.body.longURL;
    urlDatabase[tinyString].userID = req.session.user_id;
    res.redirect(`/urls/${tinyString}`);
  }
});

app.put("/urls/:shortUrl", (req, res) => {
  //checks if the user is logged in
  if (!req.session.user_id) {
    return res.status(400).send("400: you must be logged in to edit urls");
  }
  
  const userUrlDatabase = createUserUrlDatabase(urlDatabase, req.session.user_id);
  
  //checks if user owns the url they are trying to access
  if (!userUrlDatabase[req.params.shortUrl]) {
    return res.status(400).send("400: you can only edit your own urls");
  }
  
  const shortURL = req.params.shortUrl;

  if(req.body.longURL){                                  //if submitting a url
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.redirect(`/urls/${shortURL}`);
  }
});

app.delete("/urls/:shortUrl/delete", (req, res) => {
  //checks if user is logged in
  if (!req.session.user_id) {
    return res.status(400).send("400: you must be logged in to delete urls");
  }

  const userUrlDatabase = createUserUrlDatabase(urlDatabase, req.session.user_id);

  //checks if user onws the url
  if (!userUrlDatabase[req.params.shortUrl]) {
    return res.status(400).send("400: you can only delete your own urls");
  }

  const databaseKey = req.params.shortUrl;
  delete urlDatabase[databaseKey];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {  //checks is there are blank fields
    return res.status(400).send("400: email or password cannot be blank, <a href='/login'>back to login</a>");
  }

  const user = findUserByEmail(email, users);
  
  if (!user) {      //checks if user already registered
    return res.status(403).send("403: e-mail cannot be found, <a href='/login'>back to login</a>");
  }

  if (!bcrypt.compareSync(password, users[user.id].password)) {
    return res.status(403).send("403: password is not a match, <a href='/login'>back to login</a>");
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  //1. if the Session is already there
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {  //2. If the user is not logged in
    res.render("login");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;   //clear cookies
  res.redirect("/login");
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {   //if the url is not in the database
    return res.status(404).send("404: tiny url not found");       //send error
  }

  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {  //checks if user is logged in
    return res.status(400).send("400: you must be <a href='/login'>logged in</a> to have access to urls");
  }

  const userUrlDatabase = createUserUrlDatabase(urlDatabase, req.session.user_id);

  const templateVars = { urls: userUrlDatabase, user: users[req.session.user_id] };  //templete variables
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };

  //checks if user is logged in
  if (!templateVars.user) {
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  //check if user is logged in
  if (!req.session.user_id) {
    return res.status(400).send("400: you must be logged in to have access to urls");
  }
  
  const userUrlDatabase = createUserUrlDatabase(urlDatabase, req.session.user_id);
  
  //check if url belongs to user
  if (!userUrlDatabase[req.params.shortURL]) {
    return res.status(400).send(`400: ${req.params.shortURL} is not one of your short URLs`);
  }
  
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id] };

  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
