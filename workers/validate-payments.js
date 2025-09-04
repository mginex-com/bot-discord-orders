const { ComponentType, ButtonStyle } = require("discord.js");
const { db, api, formatValue, getStore, formatPrice } = require("../@shared");
const config = require("../config.json");

module.exports = {
    execute: (client) => {
        client.on("clientReady", () => {
            const guild = client.guilds.cache.get(config.guildId);

            setInterval(() => {
                const all = db.all();
                const checkouts = all.filter((entry) => {
                    return entry.ID.startsWith("checkout:") && entry.data.status === "PENDING";
                });

                for (const checkout of checkouts) {
                    api.get("/open-api/checkout/order/" + checkout.data.order.orderId + "/payment").then(async (response) => {
                        const data = response.data;

                        checkout.data.status = data.status;
                        db.set(checkout.ID, checkout.data);

                        if (data.status !== "PENDING") {
                            // const channel = await guild.channels.fetch(checkout.ID.split(":")[1]);
                            // if (!channel) return;

                            const member = await guild.members.cache.get(checkout.data.userId);
                            if (!member) return;

                            const fields = [
                                {
                                    name: `Valor total:`,
                                    value: `\`\`\`${formatPrice(checkout.data.total)}\`\`\``,
                                },
                                {
                                    name: `Data da compra:`,
                                    value: `\`\`\`${new Date().toLocaleDateString("pt-br")}\`\`\``,
                                },
                            ];

                            if (checkout.data.coupon) {
                                fields.push({
                                    name: `Cupom (\`${checkout.data.coupon.code}\`):`,
                                    value: `\`\`\`-${formatValue(
                                        checkout.data.coupon.discount.type,
                                        checkout.data.coupon.discount.amount
                                    )}\`\`\``,
                                });
                            }

                            member.send({
                                embeds: [
                                    {
                                        title: `Pagamento aprovado com sucesso!`,
                                        description: [
                                            "Para sua segurança os items da sua compra estão disponíveis no link logo abaixo, utilize o botão abaixo para navegar até a sua compra e resgatar seu produto.",
                                            "",
                                            `💗 Agradeçemos a sua preferência!`,
                                        ].join("\n"),
                                        fields,
                                    },
                                ],
                                components: [
                                    {
                                        type: ComponentType.ActionRow,
                                        components: [
                                            {
                                                type: ComponentType.Button,
                                                style: ButtonStyle.Link,
                                                label: "Resgatar produto",
                                                url: new URL(`/order/${checkout.data.order.orderId}`, getStore().url).toString(),
                                            },
                                        ],
                                    },
                                ],
                            });
                        }
                    });
                }
            }, 1000);
        });
    },
};
