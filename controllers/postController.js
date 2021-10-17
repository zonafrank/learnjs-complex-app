const { findSingleById } = require("../models/Post");
const Post = require("../models/Post");

exports.viewCreateScreen = function (req, res) {
  res.render("create-post");
};

exports.create = function (req, res) {
  let post = new Post(req.body, req.session.user._id);

  post
    .create()
    .then(() => {
      res.redirect(`/profiles/${req.session.user.username}`);
    })
    .catch((errors) => {
      res.send(errors);
    });
};

exports.viewSinglePost = async function (req, res) {
  try {
    const post = await Post.findSingleById(req.params.id, req.visitorId);
    res.render("single-post-screen", { post });
  } catch (error) {
    res.render("404");
  }
};

exports.viewEditScreen = async function (req, res) {
  try {
    const post = await findSingleById(req.params.id, req.visitorId)
    console.log(req.params.id)
    console.log(post)
  res.render("edit-post", {post})
  } catch (error) {
    res.render("404")
  }
}

exports.edit = async function (req, res) {
  
} 