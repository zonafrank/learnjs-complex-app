const postsCollection = require("../db").db().collection("posts");
const ObjectId = require("mongodb").ObjectId;
const md5 = require("md5");

const Post = function (data, userId) {
  this.data = data;
  this.errors = [];
  this.userId = userId;
};

Post.prototype.cleanUp = function () {
  if (typeof this.data.title !== "string") {
    this.data.title = "";
  }

  if (typeof this.data.body !== "string") {
    this.data.body = "";
  }

  this.data = {
    title: this.data.title?.trim(),
    body: this.data.body?.trim(),
    createdDate: new Date(),
    author: ObjectId(this.userId),
  };
};

Post.prototype.validate = function () {
  if (!this.data.title) {
    this.errors.push("You must provide a title");
  }

  if (!this.data.body) {
    this.errors.push("You must provide a title");
  }
};

Post.prototype.create = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    this.validate();

    if (this.errors.length > 0) {
      reject(this.errors);
    } else {
      // save post into database
      postsCollection
        .insertOne(this.data)
        .then(() => {
          resolve();
        })
        .catch(() => {
          this.errors.push("Please try again later.");
          reject(this.errors);
        });
    }
  });
};

Post.reusablePostQuery = async function (uniqueOperations, visitorId) {
  let aggOperations = uniqueOperations.concat([
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "authorDocument",
      },
    },
    {
      $project: {
        title: 1,
        body: 1,
        createdDate: 1,
        authorId: "$author",
        author: { $arrayElemAt: ["$authorDocument", 0] },
      },
    },
  ]);
  let posts = await postsCollection.aggregate(aggOperations).toArray();

  // clean up author property in each post object
  return posts.map(function (post) {
    post.isVisitorOwner = post.authorId.equals(visitorId)
    post.author = {
      username: post.author.username,
      avatar: `https://gravatar.com/avatar/${md5(post.author.email)}?s=128`,
    };
    return post;
  });
};

Post.findSingleById = async function (id, visitorId) {
  if (typeof id === "string" && ObjectId.isValid(id)) {
    let posts = await Post.reusablePostQuery([
      { $match: { _id: ObjectId(id) } },
    ], visitorId);

    if (posts.length) {
      return posts[0];
    } else {
      throw new Error("Post not found");
    }
  } else {
    throw new Error("Invalid post id");
  }
};

Post.findByAuthorId = async function (authorId, visitorId) {
  const posts =  await Post.reusablePostQuery([
    { $match: { author: ObjectId(authorId) } },
    { $sort: { createdDate: -1 } },
  ], visitorId);
  return posts
};

module.exports = Post;
