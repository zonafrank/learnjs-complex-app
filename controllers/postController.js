const { findSingleById } = require("../models/Post");
const Post = require("../models/Post");

exports.viewCreateScreen = function (req, res) {
  res.render("create-post");
};

exports.create = function (req, res) {
  let post = new Post(req.body, req.session.user._id);

  post
    .create()
    .then((postId) => {
      req.flash("success", "New post successfully created")
      req.session.save(res.redirect(`/posts/${postId}`))
    })
    .catch((errors) => {
      errors.forEach(error => req.flash("errors", error))
      req.session.save(() => res.redirect("/create-post"))
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
    const post = await findSingleById(req.params.id, req.visitorId);
    if (post.isVisitorOwner) {
      res.render("edit-post", { post });
    } else {
      req.flash("errors", "You do not have permission to perform that action")
      req.session.save(() => res.redirect("/"))
    }
  } catch (error) {
    res.render("404");
  }
};

exports.edit = async function (req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id);
  post
    .update()
    .then((status) => {
      // the post was successfully updated in the database
      // or user did have permission but there were validation errors
      if (status === "success") {
        // post was updated in db
        req.flash("success", "Post successfully updatetd")
        req.session.save(() => {
          res.redirect(`/posts/${req.params.id}`)
        })
      } else {
        post.errors.forEach((error) => {
          req.flash("errors", error)
        })

        req.session.save(() => {
          res.redirect(`/posts/${req.params.id}/edit`)
        })
      }
    })
    .catch(() => {
      // a post with the requested id does not exist
      // or if the current visitor is not the owner of the post
      req.flash("errors", "You do not have permission to perform that action")
      req.session.save(() => {
        res.redirect("/")
      })
    });
};

exports.delete = async function (req, res) {
  Post.delete(req.params.id, req.visitorId).then(() => {
    req.flash("success", "Post was successfully deleted")
    req.session.save(() => res.redirect(`/profiles/${req.session.user.username}`))
  }).catch((error) => {
    req.flash("errors", "You do not have permission to perform that action")
    req.session.save(() => res.redirect("/"))
  })
}