const { api, db } = require("../@shared");

module.exports = {
  type: "interactionCreate",
  execute: async (interaction) => {
    if (
      (!interaction.isStringSelectMenu() && !interaction.isButton()) ||
      !interaction.customId.startsWith("buy-product:")
    )
      return;

    await interaction.deferReply({ ephemeral: true });

    const productId = interaction.customId.split(":")[1];

    function validateStock(inventory) {
      if (inventory.stock === null) return true;
      if (inventory.stock > 0) return true;

      interaction.editReply({
        content: "Desculpe, este produto está esgotado no momento.",
      });
      return false;
    }

    api.get("/open-api/catalog/product/" + productId).then((response) => {
      const product = response.data;

      if (product.type === "DEFAULT") {
        const result = validateStock(product.inventory);
        if (!result) return;
      } else {
        const variant = product.variants.find(
          (variant) => variant.id === interaction.values[0]
        );
        const result = validateStock(variant.inventory);
        if (!result) return;
      }

      db.set(`checkout:${interaction.user.id}`, {});

      interaction.channel.threads
        .create({
          name: `checkout-${interaction.user.username}`,
          type: 11,
          reason: "Iniciando checkout",
          invitable: false,
          ownerId: interaction.user.id,
        })
        .then(async (thread) => {
          thread.members.add(interaction.user.id);
          await thread.send({ content: "Hi how are you?" });
        });
    });
  },
};
