const { Client } = require("discord.js");
const Discord = require("discord.js");
const config = require("./config.json");
const fg = require("fast-glob");
const { api, db } = require("./@shared");

const client = new Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessageReactions,
        "32767",
    ],
});

const commandContainer = new Discord.Collection();
fg.sync("commands/**/*.js").map((file) => {
    const command = require(`./${file}`);
    commandContainer.set(command.options.name, command);
});

fg.sync("events/**/*.js").map((file) => {
    const event = require(`./${file}`);

    client.on(event.type, (...args) => event.execute(...args, client));
});

fg.sync("workers/**/*.js").map((file) => {
    const worker = require(`./${file}`);

    worker.execute(client);
});

client.on("interactionCreate", (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commandContainer.get(interaction.commandName);
    command.execute(interaction);
});

(async () => {
    try {
        const req = await api.get("/open-api/store");

        db.set("store", req.data.store);

        client.on("clientReady", () => {
            console.log("Mginex is online!");
            console.log(`Loja conectada: ${req.data.store.settings.title}`);
            console.log(`ID da loja: ${req.data.store.id}`);

            client.application.commands.set(
                commandContainer.map((command) => {
                    return command.options;
                })
            );
        });

        client.login(config.token).catch(() => {
            console.error("Invalid token provided!");
        });
    } catch (error) {}
})();
