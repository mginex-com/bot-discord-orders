const { api } = require("../@shared");

module.exports = {
  type: "interactionCreate",
  execute: (interaction) => {
    if (!interaction.isAutocomplete() || interaction.responded) return;

    const focused = interaction.options.getFocused(true);
    if (focused.name !== "id-produto") return;

    api
      .get(`/open-api/catalog/product?limit=1000&title=${focused.value}`)
      .then((response) => {
        interaction.respond(
          response.data.products.map((product) => {
            return { name: product.info.title, value: product.id };
          })
        );
      });
  },
};
