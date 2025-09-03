const { db } = require("../@shared");
const { ProductMessage } = require("../@shared/messages");

module.exports = {
  type: "interactionCreate",
  execute: async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    const productId = interaction.customId.split(":")[1];

    db.set(`product:${productId}`, {
      id: productId,
      title: interaction.fields.getTextInputValue("title"),
      description: interaction.fields.getTextInputValue("description") || null,
      image: interaction.fields.getTextInputValue("image") || null,
      footer: interaction.fields.getTextInputValue("footer") || null,
    });

    await interaction.deferReply({ ephemeral: true });

    await interaction.channel.send(await ProductMessage(productId));

    interaction.editReply({
      content: "Produto setado com sucesso!",
    });
  },
};
