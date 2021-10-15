const User = require("../models/User");

exports.login = async function (req, res) {
  try {
    const user = new User(req.body);
    const dbResponse = await user.login();
    req.session.user = { favColor: "blue", username: user.data.username };
    req.session.save(() => {
      res.redirect("/");
    });
  } catch (error) {
    req.flash("errors", error.message);
    req.session.save(() => {
      res.redirect("/");
    });
  }
};

exports.logout = function (req, res) {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

exports.register = async function (req, res) {
  try {
    const user = new User(req.body);
    const dbRes = await user.register();
    if (user.errors.length > 0) {
      user.errors.forEach((error) => {
        req.flash("regErrors", error);
      });

      req.session.save(() => {
        res.redirect("/");
      });
    } else {
      req.session.user = { username: user.data.username };
      req.session.save(() => {
        res.redirect("/");
      });
    }
  } catch (error) {
    throw error;
  }
};

exports.home = function (req, res) {
  if (req.session.user) {
    res.render("home-dashboard", { username: req.session.user.username });
  } else {
    res.render("home-guest", {
      errors: req.flash("errors"),
      regErrors: req.flash("regErrors"),
    });
  }
};
