const { ComponentType, TextInputStyle } = require("discord.js");
const { api, db } = require("../@shared");
const { CheckoutPanel } = require("../@shared/messages");

module.exports = {
    type: "interactionCreate",
    execute: async (interaction) => {
        if (interaction.isButton() && interaction.customId === "add-coupon") {
            interaction.showModal({
                custom_id: "add-coupon",
                title: "Adicionar cupom",
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                custom_id: "code",
                                type: ComponentType.TextInput,
                                label: "Código do cupom",
                                style: TextInputStyle.Short,
                                placeholder: "Exemplo: VALE30 (30% de desconto)",
                            },
                        ],
                    },
                ],
            });
        }

        if (interaction.isModalSubmit() && interaction.customId === "add-coupon") {
            await interaction.deferUpdate();
            const code = interaction.fields.getTextInputValue("code");

            const checkout = db.get(`checkout:${interaction.channelId}`);

            api.get("/open-api/catalog/coupon/" + code)
                .then(async (response) => {
                    const coupon = response.data;
                    if (
                        !coupon.allProducts &&
                        !coupon.products.includes(checkout.productId) &&
                        !coupon.categories.includes(checkout.categoryId)
                    )
                        return interaction.followUp({
                            content: "O cupom não é válido para este produto.",
                            ephemeral: true,
                        });

                    checkout.coupon = {
                        code: coupon.code,
                        type: coupon.discount.type,
                        amount: coupon.discount.amount,
                    };
                    db.set(`checkout:${interaction.channelId}`, checkout);
                    await interaction.editReply(await CheckoutPanel({ interaction, checkoutId: interaction.channelId }));
                    interaction.followUp({
                        content: `Cupom \`${coupon.code}\` aplicado com sucesso!`,
                        ephemeral: true,
                    });
                })
                .catch(() => {
                    interaction.followUp({
                        content: "Cupom inválido ou não está disponível para o uso.",
                        ephemeral: true,
                    });
                });
        }
    },
};
