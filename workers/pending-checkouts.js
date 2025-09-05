const { db } = require("../@shared");
const config = require("../config.json");
const { differenceInMinutes } = require("date-fns");

module.exports = {
    execute: (client) => {
        client.on("clientReady", async () => {
            const guild = client.guilds.cache.get(config.guildId);

            setInterval(async () => {
                const all = db.all();
                const checkouts = all.filter((entry) => {
                    return (
                        ((entry.ID.startsWith("checkout:") && entry.data.status === "PENDING") ||
                            entry.data.status === "DRAFT") &&
                        differenceInMinutes(new Date(), entry.data.createdAt) >= 5
                    );
                });

                for (const checkout of checkouts) {
                    const channel = await guild.channels.cache.get(checkout.ID.split(":")[1]);
                    if (!channel) return;

                    const member = await guild.members.cache.get(checkout.data.userId);
                    if (!member) return;

                    channel.delete().catch(console.log);
                    member
                        .send({
                            content: `Seu carrinho foi fechado automaticamente por não realizar o pagamento após 5 minutos.`,
                        })
                        .catch(console.log);
                }
            }, 1000 * 60);
        });
    },
};
