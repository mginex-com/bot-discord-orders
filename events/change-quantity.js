const { api, db } = require("../@shared");
const { CheckoutPanel } = require("../@shared/messages");

module.exports = {
    type: "interactionCreate",
    execute: async (interaction) => {
        if (!interaction.isButton() || (interaction.customId !== "add-quantity" && interaction.customId !== "remove-quantity"))
            return;

        const checkout = db.get(`checkout:${interaction.message.channelId}`);

        if (interaction.isButton() && interaction.customId === "add-quantity") {
            await interaction.deferUpdate();

            api.get("/open-api/catalog/product/" + checkout.productId).then(async (response) => {
                const product = response.data;
                if (checkout.quantitty < product.inventory.stock || product.inventory.stock === null) {
                    checkout.quantity += 1;
                    checkout.total = checkout.quantity * checkout.unitPrice;
                    db.set(`checkout:${interaction.message.channelId}`, checkout);
                    await interaction.message.edit(
                        await CheckoutPanel({ interaction, checkoutId: interaction.message.channelId, product })
                    );
                }
            });
        }

        if (interaction.isButton() && interaction.customId === "remove-quantity") {
            await interaction.deferUpdate();
            checkout.quantity -= 1;
            checkout.total = checkout.quantity * checkout.unitPrice;
            db.set(`checkout:${interaction.message.channelId}`, checkout);
            await interaction.message.edit(await CheckoutPanel({ interaction, checkoutId: interaction.message.channelId }));
        }
    },
};
