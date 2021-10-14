require("dotenv").config();
const dbConn = require("./db");
const app = require("./app");

const PORT = process.env.PORT;

dbConn
  .connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`App started on port ${PORT}`);
    });
  })
  .catch((err) => console.log);
