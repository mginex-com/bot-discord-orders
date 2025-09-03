const { Client } = require("discord.js");
const Discord = require("discord.js");
const config = require("./config.json");
const fg = require("fast-glob");

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

client.on("clientReady", () => {
  console.log("Mginex is online!");

  client.application.commands.set(
    commandContainer.map((command) => {
      return command.options;
    })
  );
});

client.on("interactionCreate", (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandContainer.get(interaction.commandName);
  command.execute(interaction);
});

client.login(config.token).catch(() => {
  console.error("Invalid token provided.");
});
