const ObjectId = require("mongodb").ObjectId;
const User = require("./User");

const usersCollection = require("../db").db().collection("users");
const followsCollection = require("../db").db().collection("follows");

let Follow = function (followedUsername, authorId) {
  this.followedUsername = followedUsername;
  this.authorId = ObjectId(authorId);
  this.errors = [];
};

Follow.prototype.cleanUp = function (params) {
  if (typeof this.followedUsername !== "string") {
    this.followedUsername = "";
    this.errors.push("The username provided for followedUsername is invalid");
  }
};

Follow.prototype.validate = async function (action) {
  // followed username must exist in database
  if (this.followedUsername) {
    let followedAccount = await usersCollection.findOne({
      username: this.followedUsername,
    });
    if (followedAccount) {
      this.followedId = followedAccount._id;
    } else {
      this.errors.push("You cannot follow a user that does not exist");
    }

    let doesFollowExist = await followsCollection.findOne({
      followedId: this.followedId,
      authorId: ObjectId(this.authorId),
    });

    if (doesFollowExist && action === "create") {
      this.errors.push("You are already following this user");
    }

    if (!doesFollowExist && action === "delete") {
      if (!doesFollowExist) {
        this.errors.push("You are currently not following this user");
      }
    }

    if (this.followedId.toString() === this.authorId.toString()) {
      this.errors.push("You cannot follow yourself.");
    }
  }
};

Follow.prototype.create = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate("create");
    if (!this.errors.length) {
      await followsCollection.insertOne({
        followedId: this.followedId,
        authorId: this.authorId,
      });
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

Follow.prototype.delete = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate("delete");
    if (!this.errors.length) {
      await followsCollection.deleteOne({
        followedId: this.followedId,
        authorId: this.authorId,
      });
      resolve();
    } else {
      reject(errors);
    }
  });
};

Follow.isVisitorFollowing = async function (followedId, visitorId) {
  let followDoc = await followsCollection.findOne({
    followedId: followedId,
    authorId: ObjectId(visitorId),
  });
  if (followDoc) {
    return true;
  } else {
    return false;
  }
};

Follow.getFollowersById = async function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followsCollection
        .aggregate([
          { $match: { followedId: id } },
          {
            $lookup: {
              from: "users",
              localField: "authorId",
              foreignField: "_id",
              as: "userDoc",
            },
          },
          {
            $project: {
              username: { $arrayElemAt: ["$userDoc.username", 0] },
              email: { $arrayElemAt: ["$userDoc.email", 0] },
            },
          },
        ])
        .toArray();

      followers = followers.map((follower) => {
        let user = new User(follower);
        user.getAvatar(follower.email);
        return { username: follower.username, avatar: user.avatar };
      });

      resolve(followers)
    } catch (error) {
      reject();
    }
  });
};

Follow.getFollowingById = async function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      let following = await followsCollection
        .aggregate([
          { $match: { authorId: id } },
          {
            $lookup: {
              from: "users",
              localField: "followedId",
              foreignField: "_id",
              as: "userDoc",
            },
          },
          {
            $project: {
              username: { $arrayElemAt: ["$userDoc.username", 0] },
              email: { $arrayElemAt: ["$userDoc.email", 0] },
            },
          },
        ])
        .toArray();

      following = following.map((f) => {
        let user = new User(f);
        user.getAvatar(f.email);
        return { username: f.username, avatar: user.avatar };
      });

      resolve(following)
    } catch (error) {
      reject();
    }
  });
};

Follow.countFollowersById = function(id) {
  return new Promise(async (resolve, reject) => {
    let followersCount = await followsCollection.countDocuments({followedId: id})
    resolve(followersCount)
  })
}

Follow.countFollowingById = function(id) {
  return new Promise(async (resolve, reject) => {
    let followingCount = await followsCollection.countDocuments({authorId: id})
    resolve(followingCount)
  })
}

module.exports = Follow;
