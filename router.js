const express = require("express");
const router = express.Router();
const userController = require("./controllers/userController");
const { mustBeLoggedIn } = require("./controllers/userController");
const postController = require("./controllers/postController");

// user related routes
router.get("/", userController.home);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/dashboard", userController.viewDashboard)

// post related routes
router.get("/create-post", mustBeLoggedIn, postController.viewCreateScreen);
router.post("/create-post", mustBeLoggedIn, postController.create);

module.exports = router;
