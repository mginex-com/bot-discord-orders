const { ComponentType, TextInputStyle, ButtonStyle } = require("discord.js");
const { db, getStore, api, formatPrice } = require("../@shared");
const { startCase } = require("lodash");

module.exports = {
    type: "interactionCreate",
    execute: async (interaction) => {
        if (interaction.isStringSelectMenu() && interaction.customId === "payment-method") {
            const checkout = db.get(`checkout:${interaction.channelId}`);
            const store = getStore();

            checkout.paymentMethod = interaction.values[0];
            db.set(`checkout:${interaction.channelId}`, checkout);

            const requiredFields = store.gateways.find((gateway) => gateway.name === checkout.paymentMethod).requiredFields;

            interaction.showModal({
                custom_id: "payer-fields",
                title: "Informações adicionais",
                components: requiredFields.map((field) => {
                    return {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                custom_id: field,
                                type: ComponentType.TextInput,
                                label:
                                    field === "name"
                                        ? "Nome"
                                        : field === "surname"
                                        ? "Sobrenome"
                                        : field === "email"
                                        ? "Email"
                                        : "CPF",
                                required: true,
                                style: TextInputStyle.Short,
                            },
                        ],
                    };
                }),
            });
        }

        if (interaction.isModalSubmit() && interaction.customId === "payer-fields") {
            const store = getStore();

            const checkout = db.get(`checkout:${interaction.channelId}`);
            await interaction.deferUpdate();

            checkout.payer = interaction.fields.fields.map((field) => ({
                id: field.customId,
                value: field.value,
            }));

            checkout.payer = interaction.fields.fields.reduce((prev, current) => {
                prev[current.customId] = current.value;
                return prev;
            }, {});

            db.set(`checkout:${interaction.channelId}`, checkout);

            await interaction.editReply({
                embeds: [
                    {
                        description: `Gerando pagamento..., aguarde um pouco por favor`,
                    },
                ],
                components: [],
            });

            api.post("/open-api/checkout/order", {
                items: [
                    {
                        productId: checkout.productId,
                        variantId: checkout.variantId,
                        quantity: checkout.quantity,
                        fields: checkout.fields,
                    },
                ],
                payer: checkout.payer,
                paymentMethod: checkout.paymentMethod,
                referenceCode: null,
                utmParams: null,
            })
                .then((response) => {
                    const components = [];

                    checkout.order = response.data;
                    checkout.status = "PENDING";
                    db.set(`checkout:${interaction.channelId}`, checkout);

                    if (checkout.paymentMethod === "PIX") {
                        components.push({
                            type: ComponentType.Button,
                            style: ButtonStyle.Secondary,
                            label: "QR Code",
                            custom_id: "qr-code",
                        });
                        components.push({
                            type: ComponentType.Button,
                            style: ButtonStyle.Secondary,
                            label: "Copia e Cola",
                            custom_id: "pix-code",
                        });
                        components.push({
                            type: ComponentType.Button,
                            style: ButtonStyle.Link,
                            label: "Pagar no site",
                            url: checkout.order.payment.paymentLink,
                        });
                    } else {
                        components.push({
                            type: ComponentType.Button,
                            style: ButtonStyle.Link,
                            label: "Pagar no site",
                            url: checkout.order.payment.paymentLink,
                        });
                        components.push({
                            custom_id: "cancel-checkout",
                            type: ComponentType.Button,
                            label: "Cancelar compra",
                            style: ButtonStyle.Danger,
                        });
                    }

                    components.push({
                        type: ComponentType.Button,
                        style: ButtonStyle.Link,
                        label: "Ir para o site",
                        url: new URL(`/order/${checkout.order.orderId}`, store.url).toString(),
                    });

                    interaction.editReply({
                        embeds: [
                            {
                                title: `Pagamento gerado com sucesso!`,
                                description: [
                                    "Para finalizar, realize o pagamento do pedido e conclua sua compra.",

                                    "",
                                    `> Utilize os botões logo abaixo para realizar o pagamento.`,
                                ].join("\n"),
                                fields: [
                                    {
                                        name: `Preço total:`,
                                        value: `\`\`\`${formatPrice(checkout.total)}\`\`\``,
                                    },
                                    {
                                        name: `Método de pagamento:`,
                                        value: `\`\`\`${startCase(checkout.paymentMethod)}\`\`\``,
                                    },
                                ],
                            },
                        ],
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components,
                            },
                        ],
                    });
                })
                .catch((error) => {
                    interaction.editReply({
                        content: `Houve um erro ao tentar gerar o pagamento, código de erro: \`\`\`${JSON.stringify(
                            error
                        )}\`\`\``,
                        embeds: [],
                    });
                });
        }
    },
};
