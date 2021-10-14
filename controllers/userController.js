const User = require("../models/User");

exports.login = function (params) {};

exports.logout = function (params) {};

exports.register = function (req, res) {
  const user = new User(req.body);
  user.register();
  if (user.errors.length > 0) {
    res.send(user.errors);
  } else {
    res.send("Congrats, you are registered.");
  }
};

exports.home = function (req, res) {
  res.render("home-guest");
};
