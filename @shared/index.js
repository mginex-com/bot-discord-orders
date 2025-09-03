const axios = require("axios");
const config = require("../config.json");
const { JsonDatabase } = require("wio.db");

const db = new JsonDatabase({
  databasePath: "./databases/db.json",
});

module.exports = {
  api: axios.create({
    baseURL: "https://api.mginex.com",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
  }),
  db,
  getStore: () => db.get("store"),
  formatPrice: (value) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  },
};
