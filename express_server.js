const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};

const users = {
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
}



const generateRandomString = function() {

    let charSet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    let randomNum = () =>
        Math.floor(Math.random() * charSet.length);

    let randomStr = ""

    for (let i = 0; i < 6; i++) {
        randomStr += charSet.charAt(randomNum());
    }
    return randomStr;
}



app.get("/urls", (req, res) => {
    let templateVars = {
        username: req.cookies["username"],
        urls: urlDatabase
    };
    res.render("urls_index", templateVars)
})

app.get("/register", (req, res) => {
    let templateVars = {
        users: users
    };
    res.render("register", templateVars)
})
app.post('/register', (req, res) => {
    let randomUserID = generateRandomString();
    const userEmail = req.body.email;
    const password = req.body.password
    users[randomUserID] = {
        'id': randomUserID,
        'email': userEmail,
        'password': password
    };
    res.cookie('user_id', randomUserID);
    res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
    const updatedLongURL = req.body.updatedLongURL;
    const shortURL = req.params.shortURL;
    if (updatedLongURL) {
        urlDatabase[shortURL] = updatedLongURL
    }
    res.redirect('/urls');
})

app.get("/urls/new", (req, res) => {
    let templateVars = {
        username: req.cookies["username"]
    }
    res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
    let newLongURL = req.body.longURL


    let newShortURL = generateRandomString()
    urlDatabase[newShortURL] = newLongURL

    res.redirect(`/urls/${newShortURL}`)
});

app.get("/urls/:shortURL", (req, res) => {
    let shortURL = req.params.shortURL
    let templateVars = {
        username: req.cookies["username"],
        shortURL: req.params.shortURL,
        longURL: urlDatabase[shortURL]
    };
    res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
    const longURL = urlDatabase[req.params.shortURL]
    res.redirect(longURL);
});

app.post("/login", (req, res) => {
    let username = req.body.username;
    res.cookie("username", username)
    res.redirect('/urls')
})

app.post("/logout", (req, res) => {
    res.clearCookie('username');
    res.redirect('/urls');

})

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});