const { TextInputStyle, ComponentType } = require("discord.js");
const { api, getStore, db } = require("../@shared");
const { startCase } = require("lodash");
const config = require("../config.json");

module.exports = {
    type: "interactionCreate",
    execute: async (interaction) => {
        async function showGateways() {
            await interaction.deferUpdate();

            const store = getStore();
            if (store.gateways.length < 1)
                return interaction.followUp({
                    content: `A loja não possui um gateway de pagamentos para receber no momento, tente novamente mais tarde!`,
                });

            interaction.editReply({
                embeds: [
                    {
                        title: "Selecione a forma de pagamento",
                        description: "Escolha uma das opções abaixo para prosseguir com o pagamento.",
                    },
                ],
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                custom_id: "payment-method",
                                type: ComponentType.StringSelect,
                                placeholder: "Selecione uma forma de pagamento",
                                options: store.gateways.map((gateway) => ({
                                    label: startCase(gateway.name),
                                    emoji: config.emojis.paymentMethods[gateway.name],
                                    value: gateway.name,
                                })),
                            },
                        ],
                    },
                ],
            });
        }

        if (interaction.isButton() && interaction.customId === "continue-checkout") {
            api.get("/rest-api/v1/store/checkout/custom-field", {
                headers: {
                    store_id: getStore().id,
                    secret_key: "98470ad9-916f-4c6f-ad4c-333278507dd5",
                },
            }).then((response) => {
                const customFields = response.data.customFields;

                const checkout = db.get(`checkout:${interaction.channelId}`);

                const fields = customFields.filter(
                    (field) =>
                        field.allProducts ||
                        field.products?.includes(checkout.productId) ||
                        field.categories?.includes(checkout.categoryId)
                );
                if (fields.length > 0) {
                    interaction.showModal({
                        custom_id: "custom-fields",
                        title: "Informações adicionais",
                        components: fields.map((field) => ({
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    custom_id: field.customId,
                                    type: ComponentType.TextInput,
                                    label: field.label.slice(0, 45),
                                    placeholder: field.placeholder ? field.placeholder.slice(0, 100) : null,
                                    required: field.required,
                                    style: TextInputStyle.Short,
                                    min_length: field.minLength || null,
                                    max_length: field.maxLength || 100,
                                },
                            ],
                        })),
                    });
                }
            });
        }

        if (interaction.isModalSubmit() && interaction.customId === "custom-fields") {
            const checkout = db.get(`checkout:${interaction.channelId}`);

            checkout.customFields = interaction.fields.fields.reduce((prev, current) => {
                prev[current.customId] = current.value;
                return prev;
            }, {});

            db.set(`checkout:${interaction.channelId}`, checkout);

            showGateways();
        }
    },
};
