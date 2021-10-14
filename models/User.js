const validator = require("validator");
const dbConn = require("../db");

const User = function (data) {
  this.data = data;
  this.errors = [];
};

User.prototype.validate = function () {
  const { username, email, password } = this.data;
  const userNameIsBlank = username === "";
  const passwordIsBlank = password === "";
  const passwordLengthOk =
    password && password.length >= 12 && password.length <= 100;
  const userNameLengthOk =
    username && username.length >= 3 && username.length <= 30;

  if (userNameIsBlank) {
    errors.push("You must provide a username");
  }

  if (username && !validator.isAlphanumeric(username)) {
    errors.push("Username can contain only letters and numbers");
  }

  if (!validator.isEmail(email)) {
    errors.push("You must provide a valid email address");
  }

  if (passwordIsBlank) {
    errors.push("You must provide a password");
  }

  if (!passwordLengthOk) {
    errors.push("Password length must be between 12 and 100");
  }

  if (!userNameLengthOk) {
    errors.push("Username length must be between 3 and 30");
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
    email: this.data.email.trim().toLowerCase(),
  };
};

User.prototype.register = async function () {
  // validate user data
  this.cleanUp();
  this.validate();

  // if no validation errors, save user data to database
  if (!this.errors.length) {
    const userCollection = await dbConn.db.collection("users");
    console.log(userCollection);

    userCollection
      .insertOne(this.data)
      .then((dbRes) => {
        console.log(dbRes);
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

module.exports = User;
