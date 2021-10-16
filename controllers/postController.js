const Post = require("../models/Post");

exports.viewCreateScreen = function (req, res) {
  res.render("create-post");
};

exports.create = function (req, res) {
  let post = new Post(req.body, req.session.user._id);

  post
    .create()
    .then(() => {
      res.send("new post created");
    })
    .catch((errors) => {
      res.send(errors);
    });
};

exports.viewSinglePost = async function (req, res) {
  try {
    const post = await Post.findSingleById(req.params.id);
    res.render("single-post-screen", { post });
  } catch (error) {
    res.render("404");
  }
};
