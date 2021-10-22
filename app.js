const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const router = require("./router");
const markdown = require("marked");
const sanitizeHTML = require("sanitize-html");
const csrf = require("csurf");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/api", require("./router-api"));

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
    return sanitizeHTML(markdown(content), {
      allwedTags: [
        "p",
        "br",
        "ul",
        "ol",
        "li",
        "strong",
        "bold",
        "i",
        "em",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
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

app.use(express.static("public"));
app.set("views", "views");
app.set("view engine", "ejs");

app.use(csrf());

app.use(function (req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/", router);

app.use(function (err, req, res, next) {
  if (err) {
    if (err.code === "EBADCSRFTOKEN") {
      req.flash("errors", "Cross site request forgery detected");
      req.session.save(() => {
        res.redirect("/");
      });
    } else {
      res.render("404");
    }
  }
});

const server = require("http").createServer(app);
const io = require("socket.io")(server);

io.use(function (socket, next) {
  sessionOptions(socket.request, socket.request.res, next);
});

io.on("connection", (socket) => {
  let { user } = socket.request.session;
  if (user) {
    socket.emit("welcome", {
      username: user.username,
      avatar: user.avatar,
    });

    socket.on("chatMessageFromBrowser", (data) => {
      socket.broadcast.emit("chatMessageFromServer", {
        message: sanitizeHTML(data.message, {
          allowedTags: [],
          allowedAttributes: {},
        }),
        username: user.username,
        avatar: user.avatar,
      });
    });
  }
});

module.exports = server;
