const postsCollection = require("../db").db().collection("posts");
const ObjectId = require("mongodb").ObjectId;
const md5 = require("md5");
const sanitizeHTML = require("sanitize-html");

const Post = function (data, userId, requestedPostId) {
  this.data = data;
  this.errors = [];
  this.userId = userId;
  this.requestedPostId = requestedPostId;
};

Post.prototype.cleanUp = function () {
  if (typeof this.data.title !== "string") {
    this.data.title = "";
  }

  if (typeof this.data.body !== "string") {
    this.data.body = "";
  }

  this.data = {
    title: sanitizeHTML(this.data.title?.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    }),
    body: sanitizeHTML(this.data.body?.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    }),
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
        .then((dbResponse) => {
          console.log(dbResponse);
          resolve(dbResponse.insertedId.toString());
        })
        .catch(() => {
          this.errors.push("Please try again later.");
          reject(this.errors);
        });
    }
  });
};

Post.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    try {
      const post = await Post.findSingleById(this.requestedPostId, this.userId);
      if (post.isVisitorOwner) {
        let status = await this.updateDb();
        resolve(status);
      } else {
        reject();
      }
    } catch (error) {
      reject();
    }
  });
};

Post.prototype.updateDb = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate(
        { _id: ObjectId(this.requestedPostId) },
        { $set: { title: this.data.title, body: this.data.body } }
      );
      resolve("success");
    } else {
      reject("failure");
    }
  });
};

Post.reusablePostQuery = async function (
  uniqueOperations,
  visitorId,
  finalOperations = []
) {
  let aggOperations = uniqueOperations.concat(
    [
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
    ],
    finalOperations
  );
  let posts = await postsCollection.aggregate(aggOperations).toArray();

  // clean up author property in each post object
  return posts.map(function (post) {
    post.isVisitorOwner = post.authorId.equals(visitorId);
    post.authorId = undefined;

    post.author = {
      username: post.author.username,
      avatar: `https://gravatar.com/avatar/${md5(post.author.email)}?s=128`,
    };
    return post;
  });
};

Post.findSingleById = async function (id, visitorId) {
  if (typeof id === "string" && ObjectId.isValid(id)) {
    let posts = await Post.reusablePostQuery(
      [{ $match: { _id: ObjectId(id) } }],
      visitorId
    );

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
  const posts = await Post.reusablePostQuery(
    [
      { $match: { author: ObjectId(authorId) } },
      { $sort: { createdDate: -1 } },
    ],
    visitorId
  );
  return posts;
};

Post.delete = function (postId, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(postId, currentUserId);
      if (post.isVisitorOwner) {
        await postsCollection.deleteOne({ _id: ObjectId(postId) });
        resolve();
      } else {
        reject();
      }
    } catch (error) {
      reject();
    }
  });
};

Post.search = function (searchTerm) {
  return new Promise(async (resolve, reject) => {
    if (typeof (searchTerm === "string")) {
      const regexText = new RegExp(searchTerm, "i");
      let posts = await Post.reusablePostQuery(
        [{ $match: { $text: { $search: searchTerm } } }],
        undefined,
        [{ $sort: { score: { $meta: "textScore" } } }]
      );
      resolve(posts);
    } else {
      reject();
    }
  });
};

Post.countPostsByAuthor = function(id) {
  return new Promise(async (resolve, reject) => {
    let postCount = await postsCollection.countDocuments({author: id})
    resolve(postCount)
  })
}

module.exports = Post;
