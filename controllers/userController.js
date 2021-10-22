const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");
const jwt = require("jsonwebtoken")

exports.mustBeLoggedIn = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.flash("errors", "You must be logged in to perform that action");
    req.session.save(() => {
      res.redirect("/");
    });
  }
};

exports.apiMustBeLoggedIn = function (req, res, next) {
  try {
    req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
    next();
  } catch (error) {
    res.json("Sorry, you must provide a valid token.")
  }
};

exports.login = async function (req, res) {
  try {
    const user = new User(req.body);
    await user.login();

    req.session.user = {
      avatar: user.avatar,
      username: user.data.username,
      _id: user.data._id,
    };

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

exports.apiLogin = async function (req, res) {
  try {
    const user = new User(req.body);
    await user.login();
    res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: "2d"}))
  } catch (error) {
    res.json("Oops! That password is incorrect")
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
    await user.register();

    if (user.errors.length > 0) {
      user.errors.forEach((error) => {
        req.flash("regErrors", error);
      });

      req.session.save(() => {
        res.redirect("/");
      });
    } else {
      req.session.user = {
        avatar: user.avatar,
        username: user.data.username,
        _id: user.data._id,
      };

      req.session.save(() => {
        res.redirect("/");
      });
    }
  } catch (error) {
    throw error;
  }
};

exports.viewDashboard = async function (req, res) {
  let posts = await Post.getFeed(req.session.user._id);
  res.render("home-dashboard", { posts });
};

exports.home = function (req, res) {
  if (req.session.user) {
    // fetch feed of posts for current user
    res.redirect("/dashboard");
  } else {
    res.render("home-guest", {
      regErrors: req.flash("regErrors"),
    });
  }
};

exports.profilePostsScreen = function (req, res) {
  // use post model to get posts for an author id
  Post.findByAuthorId(req.profileUser._id.toString(), req.visitorId)
    .then((posts) => {
      res.render("profile.ejs", {
        title: `Profile for ${req.profileUser.username}`,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        posts: posts,
        isFollowing: req.isFollowing,
        isOwnProfile: req.isOwnProfile,
        currentPage: "posts",
        counts: {
          postCount: req.postCount,
          followerCount: req.followerCount,
          followingCount: req.followingCount,
        },
      });
    })
    .catch(() => {
      res.render("404");
    });
};

exports.ifUserExists = function (req, res, next) {
  User.findByUsername(req.params.username)
    .then((userDoc) => {
      req.profileUser = userDoc;
      next();
    })
    .catch(() => {
      res.render("404");
    });
};

exports.sharedProfileData = async function (req, res, next) {
  let isOwnProfile = false;
  let isFollowing = false;
  if (req.session.user) {
    isOwnProfile = req.profileUser._id.equals(req.session.user._id);
    isFollowing = await Follow.isVisitorFollowing(
      req.profileUser._id,
      req.visitorId
    );
  }
  req.isFollowing = isFollowing;
  req.isOwnProfile = isOwnProfile;

  // retrieve post, follower and following counts
  let postCountPromise = Post.countPostsByAuthor(req.profileUser._id);
  let followerCountPromise = Follow.countFollowersById(req.profileUser._id);
  let followingCountPromise = Follow.countFollowingById(req.profileUser._id);

  let [postCount, followerCount, followingCount] = await Promise.all([
    postCountPromise,
    followerCountPromise,
    followingCountPromise,
  ]);

  req.postCount = postCount;
  req.followerCount = followerCount;
  req.followingCount = followingCount;
  next();
};

exports.profileFollowersScreen = async function (req, res) {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id);
    console.log(req.profileUser.username);
    res.render("profile-followers", {
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isOwnProfile: req.isOwnProfile,
      currentPage: "followers",
      counts: {
        postCount: req.postCount,
        followerCount: req.followerCount,
        followingCount: req.followingCount,
      },
    });
  } catch (error) {
    res.render("404");
  }
};

exports.profileFollowingScreen = async function (req, res) {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id);
    res.render("profile-following", {
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isOwnProfile: req.isOwnProfile,
      currentPage: "following",
      counts: {
        postCount: req.postCount,
        followerCount: req.followerCount,
        followingCount: req.followingCount,
      },
    });
  } catch (error) {
    res.render("404");
  }
};

exports.doesUsernameExist = async function (req, res) {
  try {
    const foundUser = await User.findByUsername(req.body.username);
    if (foundUser) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.json({ exists: false });
  }
};

exports.doesEmailExist = async function (req, res) {
  try {
    let emailBool = await User.doesEmailExist(req.body.email);
    if (emailBool) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    throw error;
  }
};

exports.apiGetPostsByUsername = async function(req, res) {
  try {
    let authorDoc = await User.findByUsername(req.params.username)
    let posts = await Post.findByAuthorId(authorDoc._id)
    res.json(posts)
  } catch (error) {
    res.json("Sorry, invalid request.")
  }
}