const validator = require("validator");
const usersCollection = require("../db").db().collection("users");
const bcrypt = require("bcrypt");

const User = function (data) {
  this.data = data;
  this.errors = [];
};

User.prototype.validate = async function () {
  const { username, email, password } = this.data;

  const userNameIsBlank = username === "";
  const passwordIsBlank = password === "";
  const emailIsBlank = email === "";

  const passwordLengthOk =
    password && password.length >= 12 && password.length <= 50;
  const userNameLengthOk =
    username && username.length >= 3 && username.length <= 30;

  if (userNameIsBlank) {
    this.errors.push("You must provide a username");
  }

  if (emailIsBlank) {
    this.errors.push("You must provide an email address");
  }

  if (passwordIsBlank) {
    this.errors.push("You must provide a password");
  }

  if (username && !validator.isAlphanumeric(username)) {
    this.errors.push("Username can contain only letters and numbers");
  }

  if (email && !validator.isEmail(email)) {
    this.errors.push("You must provide a valid email address");
  }

  if (password && !passwordLengthOk) {
    this.errors.push("Password length must be between 12 and 50");
  }

  if (username && !userNameLengthOk) {
    this.errors.push("Username length must be between 3 and 30");
  }

  // Only if all inputs are valid, check to see if it is already taken
  if (this.errors.length === 0) {
    let usernameExists = await usersCollection.findOne({ username });
    if (usernameExists) {
      this.errors.push("That username is already taken");
    }

    let emailExists = await usersCollection.findOne({ email });
    if (emailExists) {
      this.errors.push("That email is already taken");
    }
  }
};

User.prototype.cleanUp = function () {
  if (!(typeof this.data.username === "string")) {
    this.data.username === "";
  }

  if (!(typeof this.data.email === "string")) {
    this.data.email === "";
  }

  if (!(typeof this.data.password === "string")) {
    this.data.password === "";
  }

  // get use of bogus properties
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    password: this.data.password,
    email: this.data.email?.trim().toLowerCase(),
  };
};

User.prototype.login = async function () {
  // validate user data
  this.cleanUp();
  // const usersCollection = await client.db().collection("users");
  const foundUser = await usersCollection.findOne({
    username: this.data.username,
  });

  if (!foundUser) throw new Error("The user does not exist");

  const passwordIsCorrect = bcrypt.compareSync(
    this.data.password,
    foundUser.password
  );

  if (passwordIsCorrect) {
    return foundUser;
  }

  throw new Error("Invalid password.");
};

User.prototype.register = async function () {
  // validate user data
  this.cleanUp();
  await this.validate();

  // if no validation errors, save user data to database
  if (!this.errors.length) {
    // hash user password
    const salt = bcrypt.genSaltSync(10);
    this.data.password = bcrypt.hashSync(this.data.password, salt);

    // const usersCollection = await client.db().collection("users");
    const dbRes = await usersCollection.insertOne(this.data);
    return dbRes;
  }
};

module.exports = User;
