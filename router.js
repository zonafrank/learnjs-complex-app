const express = require("express");
const router = express.Router();
const userController = require("./controllers/userController");
const { mustBeLoggedIn } = require("./controllers/userController");
const postController = require("./controllers/postController");
const followController = require("./controllers/followController");

// user related routes
router.get("/", userController.home);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/dashboard", userController.viewDashboard);

// profile related routes
router.get(
  "/profiles/:username",
  userController.ifUserExists,
  userController.sharedProfileData,
  userController.profilePostsScreen
);
router.get(
  "/profiles/:username/followers",
  userController.ifUserExists,
  userController.sharedProfileData,
  userController.profileFollowersScreen
);
router.get(
  "/profiles/:username/following",
  userController.ifUserExists,
  userController.sharedProfileData,
  userController.profileFollowingScreen
);

// post related routes
router.get("/create-post", mustBeLoggedIn, postController.viewCreateScreen);
router.post("/create-post", mustBeLoggedIn, postController.create);
router.get("/posts/:id", postController.viewSinglePost);
router.get("/posts/:id/edit", mustBeLoggedIn, postController.viewEditScreen);
router.post("/posts/:id/edit", mustBeLoggedIn, postController.edit);
router.post("/posts/:id/delete", mustBeLoggedIn, postController.delete);
router.post("/search", mustBeLoggedIn, postController.search);

// follow related routes
router.post("/addFollow/:username", mustBeLoggedIn, followController.addFollow);
router.post(
  "/removeFollow/:username",
  mustBeLoggedIn,
  followController.removeFollow
);

module.exports = router;
