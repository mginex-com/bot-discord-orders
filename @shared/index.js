const axios = require("axios");
const config = require("../config.json");
const { JsonDatabase } = require("wio.db");

const db = new JsonDatabase({
    databasePath: "./databases/db.json",
});

module.exports = {
    api: axios.create({
        baseURL: "http://localhost:5000",
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
    formatValue: (type, value) => {
        if (type === "FIXED") return this.formatPrice(value);
        return `${value}%`;
    },
};
