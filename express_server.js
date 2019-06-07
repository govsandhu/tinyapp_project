const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

var urlDatabase = {
    b2xVn2: { longURL: "http://www.lighthouselabs.ca", user_id: "userRandomID" },
    ism5xK: { longURL: "http://www.google.com", user_id: "user2RandomID" }
  };

const users = {
    "userRandomID": {
        id: "userRandomID",
        email: "user@example.com",
        password: "123"
    },
    "user2RandomID": {
        id: "user2RandomID",
        email: "user2@example.com",
        password: "dishwasher-funk"
    }
}

function doesUserNameExist(userEmail) {
    let userExists = false;
    for (let id in users) {
        if (users[id].email === userEmail) {
            userExists = true;
            break;
        }
    }
    return userExists
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

// This renders the login page. Template vars is an object that gets passed to the login.ejs page. In this case, it passes the cookie object for the associated client ID.
app.get('/login', (req, res) => {
    let userIDCookie = req.cookies["user_id"]
    let templateVars = {
        userObject: users[userIDCookie]
    }
    res.render("login", templateVars)
})

// This adds logic to the urls page. If a cookie doesn't exist, ie. if the user is not logged in, they will receive a message to do so.
app.get("/urls", (req, res) => {
    let userIDCookie = req.cookies["user_id"]
    let urlArray = [];
    if (!userIDCookie) {
      res.status(403).send("Please log in")
      return;
    }
    let urlsForUser = (userIDCookie) => {
      if(userIDCookie) {
        for (let urlID in urlDatabase) {
          if(urlDatabase[urlID].user_id === userIDCookie) {
             urlArray.push({
              shortUrl: urlID,
              longUrl: urlDatabase[urlID].longURL
            })
          }
        }
      }
    }
    urlsForUser(userIDCookie);
    let templateVars = {
        userObject: users[userIDCookie],
        urls: urlArray,
    };

    res.render("urls_index", templateVars)
})

// This renders the register page and passes the object of the associated cookie to the register template. In this case, the object should be empty.
app.get("/register", (req, res) => {
    let userIDCookie = req.cookies["user_id"]
    let templateVars = {
      userObject: users[userIDCookie],

    };
    res.render("register", templateVars)
})

// This retrieves inputs by the user from the register page. If the fields are empty, or if the username doesn't exit, it will throw an error. If it passes those two criteria points, the name will be registered and added to the users object.
app.post('/register', (req, res) => {
    const userEmail = req.body.email;
    const password = req.body.password

    if (!userEmail || !password) {
        res.status(400).send("400: One of the fields is empty! Please enter a valid username and password")
    } else if (doesUserNameExist(userEmail)) {
        res.status(400).send("400: The email entered already exists! Please enter a valid email address")
    } else {
        let randomUserID = generateRandomString();
        users[randomUserID] = {
            'id': randomUserID,
            'email': userEmail,
            'password': password
        }
        res.cookie('user_id', randomUserID);
        res.redirect('/urls');
    }
});


// This allows the user to delete an existing url if the user is logged in.
app.post('/urls/:shortURL/delete', (req, res) => {
    let userIDCookie = req.cookies["user_id"];
    let shortURL = req.params.shortURL
    console.log(userIDCookie)
      if (urlDatabase[shortURL]) {
        if (urlDatabase[shortURL].user_id === userIDCookie) {
            delete urlDatabase[req.params.shortURL];
            res.redirect('/urls');
        } else {
          res.status(403).send("Please login")
        }
      } else {
        res.status(404).send("URL not found")
      }
});

//This allows a user to update an existing url from the current shortURL.
app.post('/urls/:shortURL', (req, res) => {
    let userIDCookie = req.cookies["user_id"]
    const updatedLongURL = req.body.updatedLongURL;
    const shortURL = req.params.shortURL;
      if (urlDatabase[shortURL]) {
        if (urlDatabase[shortURL].user_id === userIDCookie) {
          urlDatabase[shortURL].longURL = updatedLongURL
        }
      }
    res.redirect('/urls');
})

// This allows the user to create a new url.
app.get("/urls/new", (req, res) => {
    let userIDCookie = req.cookies["user_id"]
    let templateVars = {
        userObject: users[userIDCookie]
    }
    if (userIDCookie) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login')
  }
});

//Can this be removed? Should the user be able to create a url from the urls page? The fields are currently missing.
app.post("/urls", (req, res) => {
    let newLongURL = req.body.longURL
    let newShortURL = generateRandomString()
    urlDatabase[newShortURL] = newLongURL
    res.redirect(`/urls/${newShortURL}`)
});

//This shows the user the current url selected
app.get("/urls/:shortURL", (req, res) => {
    let userIDCookie = req.cookies["user_id"]
    let shortURL = req.params.shortURL
    let templateVars = {
        userObject: users[userIDCookie],
        shortURL: req.params.shortURL,
        longURL: urlDatabase[shortURL].longURL
    };
    res.render("urls_show", templateVars);
});

//This redirects the user to the long url
app.get("/u/:shortURL", (req, res) => {
    const longURL = urlDatabase[req.params.shortURL].longURL
    res.redirect(longURL);
});

//This verifies if the email/password entered are correct, and if not, sends a message that there is an error.
app.post("/login", (req, res) => {
    let userEmail = req.body.email;
    let enteredPassword = req.body.password;
    if(doesUserNameExist(userEmail)) {
      for (let userID in users) {
        if (users[userID].password === enteredPassword) {
          res.cookie("user_id", userID)
          res.redirect('/urls')
        }
      }
    }
      res.status(403).send("403: The email or password entered is incorrect")
      res.redirect('/login')
})

//This clears the cookie and logs the user out.
app.post("/logout", (req, res) => {
    res.clearCookie('user_id');
    res.redirect('/urls');

})

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});