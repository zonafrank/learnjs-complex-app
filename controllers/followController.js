const Follow = require("../models/Follow");

exports.addFollow = async function (req, res) {
  try {
    let follow = new Follow(req.params.username, req.visitorId);
    await follow.create();
    req.flash("success", `Successfully followed ${req.params.username}`);

    req.session.save(() => {
      res.redirect(`/profiles/${req.params.username}`);
    });
  } catch (errors) {
    errors.forEach((error) => {
      req.flash("errors", error);
    });

    req.session.save(() => {
      res.redirect("/");
    });
  }
};

exports.removeFollow = async function (req, res) {
  try {
    let follow = new Follow(req.params.username, req.visitorId);
    await follow.delete();
    req.flash("success", `Successfully stopped following ${req.params.username}`);

    req.session.save(() => {
      res.redirect(`/profiles/${req.params.username}`);
    });
  } catch (errors) {
    errors.forEach((error) => {
      req.flash("errors", error);
    });

    req.session.save(() => {
      res.redirect("/");
    });
  }
};