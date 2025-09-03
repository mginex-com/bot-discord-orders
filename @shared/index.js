const axios = require("axios");
const config = require("../config.json");
const { JsonDatabase } = require("wio.db");

module.exports = {
  api: axios.create({
    baseURL: "https://api.mginex.com",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
  }),
  db: new JsonDatabase({
    databasePath: "./databases/db.json",
  }),
};
