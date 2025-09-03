const { db } = require("../@shared");

module.exports = {
  type: "interactionCreate",
  execute: (interaction) => {
    if (!interaction.isModalSubmit()) return;

    const productId = interaction.customId.split(":")[1];

    db.set(`product:${productId}`, {
      title: interaction.fields.getTextInputValue("title"),
      description: interaction.fields.getTextInputValue("description") || null,
      image: interaction.fields.getTextInputValue("image") || null,
      footer: interaction.fields.getTextInputValue("footer") || null,
    });

    interaction.channel.send({
      content: `Produto **${productId}** setado com sucesso!`,
    });

    interaction.reply({
      content: "Produto setado com sucesso!",
    });
  },
};
