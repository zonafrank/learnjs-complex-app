const MongoClient = require("mongodb").MongoClient;

const connectionString = process.env.CONNECTION_STRING;

const client = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = {
  db: null,
  connect: async function () {
    try {
      const connection = await client.connect();
      console.log("Connected to database");
      this.db = connection.db("ComplexApp");
    } catch (error) {
      throw error;
    }
  },
};
