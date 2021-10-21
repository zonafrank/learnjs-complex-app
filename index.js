require("dotenv").config();
const dbClient = require("./db");
const server = require("./app");

const PORT = process.env.PORT;

dbClient
  .connect()
  .then(() => {
    console.log("connected to database...");
    server.listen(PORT, () => {
      console.log(`App started on port ${PORT}`);
    });
  })
  .catch((err) => console.log);
