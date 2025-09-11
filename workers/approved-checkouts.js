const { db } = require("../@shared");
const config = require("../config.json");
const { differenceInMinutes, differenceInSeconds } = require("date-fns");

module.exports = {
    execute: (client) => {
        client.on("clientReady", async () => {
            const guild = client.guilds.cache.get(config.guildId);

            setInterval(async () => {
                const all = db.all();

                const checkouts = all.filter((entry) => {
                    return (
                        entry.ID.startsWith("checkout:") &&
                        entry.data.status === "APPROVED" &&
                        differenceInSeconds(new Date(), entry.data.createdAt) >= 30
                    );
                });

                for (const checkout of checkouts) {
                    const channel = await guild.channels.cache.get(checkout.ID.split(":")[1]);
                    if (!channel) return;

                    const member = await guild.members.cache.get(checkout.data.userId);
                    if (!member) return;

                    channel.delete().catch(() => {});

                    checkout.data.status = "COMPLETED";
                    db.set(checkout.ID, checkout.data);
                }
            }, 1000 * 60);
        });
    },
};
