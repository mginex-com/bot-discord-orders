const { ChannelType, ComponentType, ButtonStyle } = require("discord-api-types/v10");
const { api, db, getStore, formatPrice } = require("../@shared");
const { CheckoutPanel, ProductMessage } = require("../@shared/messages");
const config = require("../config.json");

module.exports = {
    type: "interactionCreate",
    execute: async (interaction) => {
        if ((!interaction.isStringSelectMenu() && !interaction.isButton()) || !interaction.customId.startsWith("buy-product:"))
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

        api.get("/open-api/catalog/product/" + productId).then(async (response) => {
            const product = response.data;

            let variant = null;
            if (product.type === "DEFAULT") {
                const result = validateStock(product.inventory);
                if (!result) return;
            } else {
                variant = product.variants.find((variant) => variant.id === interaction.values[0]);
                const result = validateStock(variant.inventory);
                if (!result) return;
            }

            interaction.message.edit(await ProductMessage(response.data.id));

            const channel = await interaction.guild.channels.create({
                name: `🛒・${interaction.user.username}`,
                parent: config.categoryId,
                permissionOverwrites: [
                    {
                        id: interaction.guildId,
                        deny: ["ViewChannel"],
                    },
                    {
                        id: interaction.user.id,
                        allow: ["ViewChannel", "ReadMessageHistory"],
                        deny: ["SendMessages"],
                    },
                ],
            });

            db.set(`checkout:${channel.id}`, {
                productId: product.id,
                categoryId: product.category?.id || null,
                variantId: variant?.id || null,
                total: variant?.price || product.pricing.price,
                unitPrice: variant?.price || product.pricing.price,
                quantity: 1,
                status: "DRAFT",
                userId: interaction.user.id,
                payer: {},
                fields: {},
                createdAt: new Date(),
            });

            interaction.editReply({
                content: `Seu carrinho foi aberto com sucesso, acesse o botão abaixo para continuar o processo de checkout.`,
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                style: ButtonStyle.Link,
                                label: "Acessar carrinho",
                                url: `https://discord.com/channels/${interaction.guildId}/${channel.id}`,
                            },
                        ],
                    },
                ],
            });

            channel.send(await CheckoutPanel({ interaction, checkoutId: channel.id, product }));
        });
    },
};
