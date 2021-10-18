const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const router = require("./router");
const markdown = require("marked");
const sanitiezeHTML = require("sanitize-html");

const app = express();
const sessionOptions = session({
  secret: "today is the first day of the rest of my life",
  store: MongoStore.create({ mongoUrl: process.env.CONNECTION_STRING }),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true },
});

app.use(sessionOptions);
app.use(flash());

app.use(function (req, res, next) {
  res.locals.filterUserHTML = function (content) {
    return sanitiezeHTML(markdown(content), {
      allwedTags: ["p", "br", "ul", "ol", "li",
        "strong", "bold", "i", "em", "h1", "h2",
        "h3", "h4", "h5", "h6",
      ],
    });
  };

  res.locals.errors = req.flash("errors");
  res.locals.success = req.flash("success");

  if (req.session.user) {
    req.visitorId = req.session.user._id;
  } else {
    req.visitorId = 0;
  }

  // make user session data available from within view templates
  res.locals.user = req.session.user;
  next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));
app.set("views", "views");
app.set("view engine", "ejs");

app.use("/", router);

module.exports = app;
